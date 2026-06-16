using System.Text.Json.Serialization;

public class AIDetectionResponse
{
    [JsonPropertyName("plant")]
    public string? Plant { get; set; }

    [JsonPropertyName("disease")]
    public string? Disease { get; set; }

    [JsonPropertyName("severity")]
    public string? Severity { get; set; }

    [JsonPropertyName("pathogen_type")]
    public string? Pathogen_type { get; set; }

    [JsonPropertyName("symptoms")]
    public List<string>? Symptoms { get; set; }

    [JsonPropertyName("prevention")]
    public List<string>? Prevention { get; set; }

    [JsonPropertyName("treatment")]
    public List<string>? Treatment { get; set; }

    [JsonPropertyName("care_tips")]
    public List<string>? care_tips { get; set; }
}