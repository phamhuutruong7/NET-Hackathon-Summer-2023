using System.Text.Json.Serialization;

namespace Meatball.Api.DTOs;

public class WeatherResponseDto
{
    [JsonPropertyName("weather")] 
    public List<WeatherDto>? Weather { get; set; }
    
    [JsonPropertyName("main")]
    public MainWeatherDto? Main { get; set; }
}