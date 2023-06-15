using Meatball.Api.DTOs;

namespace Meatball.Api.Infrastructure.Abstractions;

public interface IOpenWeatherClient
{
    Task<WeatherResponseDto?> GetWeather(string zip, CancellationToken cancellationToken);
}
