namespace WukalaGPT.Domain.Entities;

public class Speciality
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;

    public ICollection<LawyerSpeciality> LawyerSpecialities { get; set; } = new List<LawyerSpeciality>();
}
