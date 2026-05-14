using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace WukalaGPT.Application.DTOs.Auth;

public class RegisterLawyerDto
{
    [Required]
    public string FullName { get; set; } = string.Empty;
    
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    public string PhoneNo { get; set; } = string.Empty;
    
    [Required]
    public string CNIC { get; set; } = string.Empty;
    
    [Required]
    public string City { get; set; } = string.Empty;
    
    [Required, MinLength(6)]
    public string Password { get; set; } = string.Empty;
    
    [Required]
    public string BarCouncilNumber { get; set; } = string.Empty;
    
    [Required]
    public string DegreeTitle { get; set; } = string.Empty;
    
    [Required]
    public int YearOfCompletion { get; set; }
    
    [Required]
    public string University { get; set; } = string.Empty;
    
    [Required]
    public string ChamberAddress { get; set; } = string.Empty;
    
    [Required]
    public IFormFile Degree { get; set; } = null!;
    
    public IFormFile? IntroVideo { get; set; }
}
