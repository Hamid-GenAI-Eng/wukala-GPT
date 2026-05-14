namespace WukalaGPT.Domain.Entities;

public class LawyerSpeciality
{
    public Guid LawyerProfileId { get; set; }
    public LawyerProfile LawyerProfile { get; set; } = null!;

    public Guid SpecialityId { get; set; }
    public Speciality Speciality { get; set; } = null!;
}
