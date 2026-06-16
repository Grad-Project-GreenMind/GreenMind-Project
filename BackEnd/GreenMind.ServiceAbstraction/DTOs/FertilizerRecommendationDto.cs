using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace GreenMind.ServiceAbstraction.DTOs
{
    public class FertilizerRecommendationDto
    {
        [Required(ErrorMessage = "Crop name is required")]
        [JsonPropertyName("crop_name")]
        public string CropName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Growth stage is required")]
        [JsonPropertyName("growth_stage")]
        public string GrowthStage { get; set; } = string.Empty;

        [Required]
        [Range(0, 120)]
        [JsonPropertyName("N")]
        public double Nitrogen { get; set; }

        [Required]
        [Range(0, 50)]
        [JsonPropertyName("P")]
        public double Phosphorus { get; set; }

        [Required]
        [Range(0, 200)]
        [JsonPropertyName("K")]
        public double Potassium { get; set; }

        [Required]
        [Range(7.0, 8.5)]
        [JsonPropertyName("ph")]
        public double PH { get; set; }

        [Required]
        [Range(10, 45)]
        [JsonPropertyName("temperature")]
        public double Temperature { get; set; }

        [Required]
        [Range(20, 80)]
        [JsonPropertyName("humidity")]
        public double Humidity { get; set; }

        [Required]
        [Range(1, 12)]
        [JsonPropertyName("month")]
        public int Month { get; set; }

        [Required]
        [JsonPropertyName("soil_type")]
        public string SoilType { get; set; } = string.Empty;

        [Required]
        [JsonPropertyName("governorate")]
        public string Governorate { get; set; } = string.Empty;
    }
}