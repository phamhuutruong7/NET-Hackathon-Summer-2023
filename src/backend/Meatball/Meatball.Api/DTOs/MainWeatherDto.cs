using System.Text.Json.Serialization;

namespace Meatball.Api.DTOs;

public class MainWeatherDto
{
    [JsonPropertyName("temp")]
    public double Temperature { get; set; }
}
