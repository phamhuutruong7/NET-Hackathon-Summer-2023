using Meatball.Api.Application.Abstractions;
using Meatball.Api.DTOs;
using Meatball.Api.Infrastructure.Abstractions;

namespace Meatball.Api.Application;

public class WeatherRecommendationApplication: IWeatherRecommendationApplication
{
    private readonly IOpenWeatherClient _openWeatherClient;
    private readonly IRecommender _recommender;

    public WeatherRecommendationApplication(IOpenWeatherClient openWeatherClient, IRecommender recommender)
    {
        _openWeatherClient = openWeatherClient;
        _recommender = recommender;
    }

    public async Task<string> GetRecommendations(string zip, CancellationToken cancellationToken)
    {
        WeatherResponseDto? weather = await _openWeatherClient.GetWeather(zip, cancellationToken);
        if (weather is null)
        {
            return "No recommendations for you, sorry.";
        }

        //return
        //    $"Hi, What should I wear if outside is {weather?.Weather?.FirstOrDefault()?.Description} and it is {weather?.Main?.Temperature} degrees Celsius.";

        return await _recommender.GetCarryOnRecommendationAsync(weather);
    }
}
