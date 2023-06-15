using Meatball.Api.Application.Abstractions;
using Meatball.Api.DTOs;
using Meatball.Api.Infrastructure.Abstractions;

namespace Meatball.Api.Application;

public class WeatherRecommendationApplication: IWeatherRecommendationApplication
{
    private readonly IOpenWeatherClient _openWeatherClient;

    public WeatherRecommendationApplication(IOpenWeatherClient openWeatherClient)
    {
        _openWeatherClient = openWeatherClient;
    }

    public async Task<string> GetRecommendations(string zip, CancellationToken cancellationToken)
    {
        WeatherResponseDto? weather = await _openWeatherClient.GetWeather(zip, cancellationToken);
        if (weather is null)
        {
            return "No recommendations for you, sorry.";
        }

        return
            $"Hi, What should I wear if outside is {weather?.Weather?.FirstOrDefault()?.Description} and it is {weather?.Main?.Temperature} degrees Celsius.";
    }
}
