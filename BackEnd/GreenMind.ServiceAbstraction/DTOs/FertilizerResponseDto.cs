using System.Text.Json.Serialization;
using System.Collections.Generic;

namespace GreenMind.ServiceAbstraction.DTOs
{
    public class FertilizerResponseDto
    {
        [JsonPropertyName("Detected Issue")]
        public string DetectedIssue { get; set; } = string.Empty;

        [JsonPropertyName("Recommendation")]
        public string Recommendation { get; set; } = string.Empty;

        [JsonPropertyName("App Method")]
        public string AppMethod { get; set; } = string.Empty;

        [JsonPropertyName("Why this choice?")]
        public string WhyThisChoice { get; set; } = string.Empty;
    }
}