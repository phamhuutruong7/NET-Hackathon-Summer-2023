using Meatball.Api.Application.Abstractions;

using Microsoft.AspNetCore.Mvc;

namespace Meatball.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class WeatherController : ControllerBase
{
    private readonly IWeatherRecommendationApplication _weatherRecommendation;

    public WeatherController(IWeatherRecommendationApplication weatherRecommendation)
    {
        _weatherRecommendation = weatherRecommendation;
    }

    [HttpGet("recommendations")]
    public async Task<IActionResult> Get(string zipCode, CancellationToken cancellationToken)
    {
        List<string> response = await _weatherRecommendation.GetRecommendations(zipCode, cancellationToken);
        return Ok(response);
    }
}