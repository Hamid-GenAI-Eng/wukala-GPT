using System.ComponentModel.DataAnnotations;

namespace WukalaGPT.Application.DTOs.Auth;

public class RegisterClientDto
{
    [Required]
    public string FullName { get; set; } = string.Empty;
    
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    public string PhoneNo { get; set; } = string.Empty;
    
    [Required]
    public string City { get; set; } = string.Empty;
    
    [Required, MinLength(6)]
    public string Password { get; set; } = string.Empty;
}
