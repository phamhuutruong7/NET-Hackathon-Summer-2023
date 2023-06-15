namespace Meatball.Api.Application.Abstractions;

public interface IWeatherRecommendationApplication
{
    Task<string> GetRecommendations(string zip, CancellationToken cancellationToken);
}
