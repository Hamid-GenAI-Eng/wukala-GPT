using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using WukalaGPT.Application.Interfaces;
using Ical.Net;
using Ical.Net.CalendarComponents;
using Ical.Net.DataTypes;
using Ical.Net.Serialization;
using ClosedXML.Excel;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace WukalaGPT.Application.Features.Hearings.CQRS;

public class ExportHearingsQuery : IRequest<ExportResult>
{
    public Guid FirmId { get; set; }
    public Guid? LawyerId { get; set; }
    public string? Week { get; set; } // ISO Date for week filter
    public string? Month { get; set; } // YYYY-MM
    public string Format { get; set; } = "pdf"; // pdf, ics, xlsx
}

public class ExportResult
{
    public byte[] Data { get; set; } = Array.Empty<byte>();
    public string ContentType { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
}

public class ExportHearingsQueryHandler : IRequestHandler<ExportHearingsQuery, ExportResult>
{
    private readonly IApplicationDbContext _context;

    public ExportHearingsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public async Task<ExportResult> Handle(ExportHearingsQuery request, CancellationToken cancellationToken)
    {
        DateOnly start;
        DateOnly end;

        if (!string.IsNullOrEmpty(request.Month) && request.Month.Length == 7)
        {
            var parts = request.Month.Split('-');
            int year = int.Parse(parts[0]);
            int month = int.Parse(parts[1]);
            start = new DateOnly(year, month, 1);
            end = new DateOnly(year, month, DateTime.DaysInMonth(year, month));
        }
        else if (!string.IsNullOrEmpty(request.Week))
        {
            var weekDate = DateOnly.Parse(request.Week);
            var dt = weekDate.ToDateTime(TimeOnly.MinValue);
            int diff = (7 + (dt.DayOfWeek - DayOfWeek.Monday)) % 7;
            start = DateOnly.FromDateTime(dt.AddDays(-1 * diff));
            end = start.AddDays(6);
        }
        else
        {
            // Default to current week
            var dt = DateTime.UtcNow;
            int diff = (7 + (dt.DayOfWeek - DayOfWeek.Monday)) % 7;
            start = DateOnly.FromDateTime(dt.AddDays(-1 * diff));
            end = start.AddDays(6);
        }

        var query = _context.Hearings.AsNoTracking()
            .Include(h => h.Case)
            .Include(h => h.LeadLawyer)
            .Where(h => h.FirmId == request.FirmId && h.HearingDate >= start && h.HearingDate <= end && h.Status == "Scheduled" && !h.IsArchived);

        if (request.LawyerId.HasValue)
        {
            query = query.Where(h => h.LeadLawyerId == request.LawyerId.Value);
        }

        var hearings = await query.OrderBy(h => h.HearingDate).ThenBy(h => h.StartTime).ToListAsync(cancellationToken);

        return request.Format.ToLower() switch
        {
            "ics" => GenerateIcal(hearings, start, end),
            "xlsx" => GenerateExcel(hearings, start, end),
            "pdf" => GeneratePdf(hearings, start, end),
            _ => throw new ArgumentException("Invalid format specified")
        };
    }

    private ExportResult GenerateIcal(List<WukalaGPT.Domain.Entities.Hearing> hearings, DateOnly start, DateOnly end)
    {
        var calendar = new Calendar();
        foreach (var h in hearings)
        {
            var evt = new CalendarEvent
            {
                Start = new CalDateTime(h.HearingDate.ToDateTime(h.StartTime)),
                End = new CalDateTime(h.HearingDate.ToDateTime(h.StartTime.AddMinutes(h.DurationMins))),
                Summary = $"Hearing: {h.Case.Title}",
                Description = $"Court: {h.CourtName} {h.CourtRoom}\nJudge: {h.JudgeName}\nCase: {h.Case.CaseNumber}",
                Location = h.CourtName,
                Uid = h.Id.ToString()
            };
            calendar.Events.Add(evt);
        }

        var serializer = new CalendarSerializer();
        var serializedCalendar = serializer.SerializeToString(calendar);
        
        return new ExportResult
        {
            Data = System.Text.Encoding.UTF8.GetBytes(serializedCalendar),
            ContentType = "text/calendar",
            FileName = $"Hearings_{start.ToString("yyyyMMdd")}_to_{end.ToString("yyyyMMdd")}.ics"
        };
    }

    private ExportResult GenerateExcel(List<WukalaGPT.Domain.Entities.Hearing> hearings, DateOnly start, DateOnly end)
    {
        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Hearings");
        
        worksheet.Cell(1, 1).Value = "Date";
        worksheet.Cell(1, 2).Value = "Time";
        worksheet.Cell(1, 3).Value = "Case Name";
        worksheet.Cell(1, 4).Value = "Case Number";
        worksheet.Cell(1, 5).Value = "Court";
        worksheet.Cell(1, 6).Value = "Judge";
        worksheet.Cell(1, 7).Value = "Assigned Lawyer";
        
        for (int i = 0; i < hearings.Count; i++)
        {
            var h = hearings[i];
            worksheet.Cell(i + 2, 1).Value = h.HearingDate.ToString("yyyy-MM-dd");
            worksheet.Cell(i + 2, 2).Value = h.StartTime.ToString("HH:mm");
            worksheet.Cell(i + 2, 3).Value = h.Case.Title;
            worksheet.Cell(i + 2, 4).Value = h.Case.CaseNumber ?? "";
            worksheet.Cell(i + 2, 5).Value = $"{h.CourtName} {h.CourtRoom}";
            worksheet.Cell(i + 2, 6).Value = h.JudgeName ?? "";
            worksheet.Cell(i + 2, 7).Value = h.LeadLawyer.FirstName + " " + h.LeadLawyer.LastName;
        }

        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        
        return new ExportResult
        {
            Data = stream.ToArray(),
            ContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            FileName = $"Hearings_{start.ToString("yyyyMMdd")}_to_{end.ToString("yyyyMMdd")}.xlsx"
        };
    }

    private ExportResult GeneratePdf(List<WukalaGPT.Domain.Entities.Hearing> hearings, DateOnly start, DateOnly end)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, QuestPDF.Infrastructure.Unit.Centimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Arial"));

                page.Header().Text($"Hearing Schedule ({start:MMM dd, yyyy} - {end:MMM dd, yyyy})")
                    .SemiBold().FontSize(16).FontColor(Colors.Blue.Darken2);

                page.Content().PaddingVertical(1, QuestPDF.Infrastructure.Unit.Centimetre).Column(col =>
                {
                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.ConstantColumn(70);
                            columns.ConstantColumn(50);
                            columns.RelativeColumn();
                            columns.RelativeColumn();
                        });

                        table.Header(header =>
                        {
                            header.Cell().Text("Date").SemiBold();
                            header.Cell().Text("Time").SemiBold();
                            header.Cell().Text("Case Details").SemiBold();
                            header.Cell().Text("Court").SemiBold();
                        });

                        foreach (var h in hearings)
                        {
                            table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(2).Text(h.HearingDate.ToString("MMM dd"));
                            table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(2).Text(h.StartTime.ToString("HH:mm"));
                            table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(2).Text($"{h.Case.Title}\n{h.Case.CaseNumber}");
                            table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(2).Text($"{h.CourtName}\n{h.JudgeName}");
                        }
                    });
                });

                page.Footer().AlignCenter().Text(x =>
                {
                    x.Span("Generated via Wukala-GPT | Page ");
                    x.CurrentPageNumber();
                });
            });
        });

        using var ms = new MemoryStream();
        document.GeneratePdf(ms);

        return new ExportResult
        {
            Data = ms.ToArray(),
            ContentType = "application/pdf",
            FileName = $"Hearings_{start:yyyyMMdd}_to_{end:yyyyMMdd}.pdf"
        };
    }
}
