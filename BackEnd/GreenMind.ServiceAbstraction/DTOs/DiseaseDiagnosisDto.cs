using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace GreenMind.ServiceAbstraction.DTOs
{
    public class DiseaseDiagnosisDto
    {
        [Required(ErrorMessage = "Please upload at least one image.")]
      
        public List<IFormFile> Images { get; set; } = new();
    }
}