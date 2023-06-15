using System.Text.Json.Serialization;

namespace Meatball.Api.DTOs;

public class WeatherDto
{
    [JsonPropertyName("description")]
    public string? Description { get; set; }
}
