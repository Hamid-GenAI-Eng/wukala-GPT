using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using WukalaGPT.Application.DTOs.Lawyer;
using WukalaGPT.Application.Interfaces;
using WukalaGPT.Domain.Entities;

namespace WukalaGPT.Application.Features.Lawyer;

public class LawyerProfileService : ILawyerProfileService
{
    private readonly IApplicationDbContext _context;
    private readonly IFileStorageService _fileStorage;

    public LawyerProfileService(IApplicationDbContext context, IFileStorageService fileStorage)
    {
        _context = context;
        _fileStorage = fileStorage;
    }

    public async Task<LawyerProfileDto> GetProfileAsync(Guid lawyerUserId)
    {
        var lawyer = await _context.LawyerProfiles
            .Include(l => l.User)
            .Include(l => l.Experiences)
            .Include(l => l.Educations)
            .Include(l => l.LawyerSpecialities)
                .ThenInclude(ls => ls.Speciality)
            .FirstOrDefaultAsync(l => l.UserId == lawyerUserId);

        if (lawyer == null)
            throw new Exception("Lawyer profile not found.");

        return new LawyerProfileDto
        {
            Id = lawyer.Id,
            UserId = lawyer.UserId,
            FirstName = lawyer.User.FirstName,
            LastName = lawyer.User.LastName,
            Email = lawyer.User.Email,
            PhoneNumber = lawyer.User.PhoneNumber,
            City = lawyer.User.City,
            
            LicenseNumber = lawyer.LicenseNumber,
            CNIC = lawyer.CNIC,
            Specialization = lawyer.Specialization,
            BarAssociation = lawyer.BarAssociation,
            BarCouncilNumber = lawyer.BarCouncilNumber,
            DegreeTitle = lawyer.DegreeTitle,
            YearOfCompletion = lawyer.YearOfCompletion,
            University = lawyer.University,
            ChamberAddress = lawyer.ChamberAddress,
            
            ProfilePhotoUrl = lawyer.ProfilePhotoUrl,
            DegreeFileUrl = lawyer.DegreeFileUrl,
            IntroVideoUrl = lawyer.IntroVideoUrl,
            
            YearsOfExperience = lawyer.YearsOfExperience,
            Bio = lawyer.Bio,
            ConsultationFee = lawyer.ConsultationFee,
            CasesWon = lawyer.CasesWon,
            ActiveCases = lawyer.ActiveCases,
            ResponseTime = lawyer.ResponseTime,
            
            IsProfileVisible = lawyer.IsProfileVisible,
            IsAvailableForNewCases = lawyer.IsAvailableForNewCases,
            ReceiveEmailNotifications = lawyer.ReceiveEmailNotifications,
            
            VerificationStatus = lawyer.VerificationStatus,
            Badges = lawyer.Badges,
            Rating = lawyer.Rating,
            ReviewCount = lawyer.ReviewCount,
            
            Experiences = lawyer.Experiences.Select(e => new ExperienceDto
            {
                Id = e.Id,
                Role = e.Role,
                FirmCompany = e.FirmCompany,
                StartDate = e.StartDate,
                EndDate = e.EndDate,
                IsCurrent = e.IsCurrent,
                ShortBio = e.ShortBio
            }).ToList(),
            
            Educations = lawyer.Educations.Select(e => new EducationDto
            {
                Id = e.Id,
                InstituteName = e.InstituteName,
                DegreeName = e.DegreeName,
                Grades = e.Grades,
                DegreeImageUrl = e.DegreeImageUrl
            }).ToList(),
            
            Specialities = lawyer.LawyerSpecialities.Select(ls => new SpecialityDto
            {
                Id = ls.Speciality.Id,
                Name = ls.Speciality.Name
            }).ToList()
        };
    }

    public async Task<LawyerProfileDto> UpdateProfileAsync(Guid lawyerUserId, UpdateLawyerProfileDto dto)
    {
        var lawyer = await _context.LawyerProfiles
            .Include(l => l.User)
            .FirstOrDefaultAsync(l => l.UserId == lawyerUserId);
            
        if (lawyer == null) throw new Exception("Lawyer profile not found.");

        if (!string.IsNullOrEmpty(dto.FirstName)) lawyer.User.FirstName = dto.FirstName;
        if (!string.IsNullOrEmpty(dto.LastName)) lawyer.User.LastName = dto.LastName;
        if (!string.IsNullOrEmpty(dto.PhoneNumber)) lawyer.User.PhoneNumber = dto.PhoneNumber;
        if (!string.IsNullOrEmpty(dto.City)) lawyer.User.City = dto.City;

        lawyer.YearsOfExperience = dto.YearsOfExperience;
        lawyer.Bio = dto.Bio;
        lawyer.ConsultationFee = dto.ConsultationFee;
        lawyer.ResponseTime = dto.ResponseTime;
        lawyer.IsProfileVisible = dto.IsProfileVisible;
        lawyer.IsAvailableForNewCases = dto.IsAvailableForNewCases;
        lawyer.ReceiveEmailNotifications = dto.ReceiveEmailNotifications;

        await _context.SaveChangesAsync(default);
        return await GetProfileAsync(lawyerUserId);
    }

    public async Task<string> UpdateProfilePhotoAsync(Guid lawyerUserId, IFormFile photo)
    {
        var lawyer = await _context.LawyerProfiles.FirstOrDefaultAsync(l => l.UserId == lawyerUserId);
        if (lawyer == null) throw new Exception("Lawyer profile not found.");

        if (lawyer.ProfilePhotoUrl != null)
        {
            // Optional: delete old photo from Cloudinary if needed.
        }

        var photoUrl = await _fileStorage.UploadFileAsync(photo, "profiles");
        
        lawyer.ProfilePhotoUrl = photoUrl;
        await _context.SaveChangesAsync(default);

        return photoUrl;
    }

    public async Task<ExperienceDto> AddExperienceAsync(Guid lawyerUserId, UpdateExperienceDto dto)
    {
        var lawyer = await _context.LawyerProfiles.FirstOrDefaultAsync(l => l.UserId == lawyerUserId);
        if (lawyer == null) throw new Exception("Lawyer profile not found.");

        var exp = new Experience
        {
            LawyerProfileId = lawyer.Id,
            Role = dto.Role,
            FirmCompany = dto.FirmCompany,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            IsCurrent = dto.IsCurrent,
            ShortBio = dto.ShortBio
        };
        
        _context.Experiences.Add(exp);
        await _context.SaveChangesAsync(default);

        return new ExperienceDto
        {
            Id = exp.Id, Role = exp.Role, FirmCompany = exp.FirmCompany, StartDate = exp.StartDate, EndDate = exp.EndDate, IsCurrent = exp.IsCurrent, ShortBio = exp.ShortBio
        };
    }

    public async Task UpdateExperienceAsync(Guid lawyerUserId, Guid experienceId, UpdateExperienceDto dto)
    {
        var lawyer = await _context.LawyerProfiles.FirstOrDefaultAsync(l => l.UserId == lawyerUserId);
        if (lawyer == null) throw new Exception("Lawyer profile not found.");

        var exp = await _context.Experiences.FirstOrDefaultAsync(e => e.Id == experienceId && e.LawyerProfileId == lawyer.Id);
        if (exp == null) throw new Exception("Experience not found.");

        exp.Role = dto.Role;
        exp.FirmCompany = dto.FirmCompany;
        exp.StartDate = dto.StartDate;
        exp.EndDate = dto.EndDate;
        exp.IsCurrent = dto.IsCurrent;
        exp.ShortBio = dto.ShortBio;

        await _context.SaveChangesAsync(default);
    }

    public async Task DeleteExperienceAsync(Guid lawyerUserId, Guid experienceId)
    {
        var lawyer = await _context.LawyerProfiles.FirstOrDefaultAsync(l => l.UserId == lawyerUserId);
        if (lawyer == null) throw new Exception("Lawyer profile not found.");

        var exp = await _context.Experiences.FirstOrDefaultAsync(e => e.Id == experienceId && e.LawyerProfileId == lawyer.Id);
        if (exp != null)
        {
            _context.Experiences.Remove(exp);
            await _context.SaveChangesAsync(default);
        }
    }

    public async Task<EducationDto> AddEducationAsync(Guid lawyerUserId, UpdateEducationDto dto)
    {
        var lawyer = await _context.LawyerProfiles.FirstOrDefaultAsync(l => l.UserId == lawyerUserId);
        if (lawyer == null) throw new Exception("Lawyer profile not found.");

        var edu = new Education
        {
            LawyerProfileId = lawyer.Id,
            InstituteName = dto.InstituteName,
            DegreeName = dto.DegreeName,
            Grades = dto.Grades
        };

        _context.Educations.Add(edu);
        await _context.SaveChangesAsync(default);

        return new EducationDto
        {
            Id = edu.Id, InstituteName = edu.InstituteName, DegreeName = edu.DegreeName, Grades = edu.Grades
        };
    }

    public async Task UpdateEducationAsync(Guid lawyerUserId, Guid educationId, UpdateEducationDto dto)
    {
        var lawyer = await _context.LawyerProfiles.FirstOrDefaultAsync(l => l.UserId == lawyerUserId);
        if (lawyer == null) throw new Exception("Lawyer profile not found.");

        var edu = await _context.Educations.FirstOrDefaultAsync(e => e.Id == educationId && e.LawyerProfileId == lawyer.Id);
        if (edu == null) throw new Exception("Education not found.");

        edu.InstituteName = dto.InstituteName;
        edu.DegreeName = dto.DegreeName;
        edu.Grades = dto.Grades;

        await _context.SaveChangesAsync(default);
    }

    public async Task DeleteEducationAsync(Guid lawyerUserId, Guid educationId)
    {
        var lawyer = await _context.LawyerProfiles.FirstOrDefaultAsync(l => l.UserId == lawyerUserId);
        if (lawyer == null) throw new Exception("Lawyer profile not found.");

        var edu = await _context.Educations.FirstOrDefaultAsync(e => e.Id == educationId && e.LawyerProfileId == lawyer.Id);
        if (edu != null)
        {
            _context.Educations.Remove(edu);
            await _context.SaveChangesAsync(default);
        }
    }

    public async Task<List<SpecialityDto>> GetAllSpecialitiesAsync()
    {
        return await _context.Specialities
            .Select(s => new SpecialityDto { Id = s.Id, Name = s.Name })
            .ToListAsync();
    }

    public async Task AssignSpecialitiesAsync(Guid lawyerUserId, List<Guid> specialityIds)
    {
        var lawyer = await _context.LawyerProfiles
            .Include(l => l.LawyerSpecialities)
            .FirstOrDefaultAsync(l => l.UserId == lawyerUserId);
            
        if (lawyer == null) throw new Exception("Lawyer profile not found.");

        // Remove existing
        _context.LawyerSpecialities.RemoveRange(lawyer.LawyerSpecialities);
        
        // Add new
        foreach (var id in specialityIds)
        {
            lawyer.LawyerSpecialities.Add(new LawyerSpeciality
            {
                LawyerProfileId = lawyer.Id,
                SpecialityId = id
            });
        }

        await _context.SaveChangesAsync(default);
    }

    public async Task AssignBadgesAsync(Guid lawyerUserId, UpdateLawyerBadgesDto dto)
    {
        var lawyer = await _context.LawyerProfiles.FirstOrDefaultAsync(l => l.UserId == lawyerUserId);
        if (lawyer == null) throw new Exception("Lawyer profile not found.");

        lawyer.Badges = dto.Badges;
        await _context.SaveChangesAsync(default);
    }
}
