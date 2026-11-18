using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace Edutrack.Dtos;

// OWNER: Lopez, Mary Vincent — WBS 7.4
public record UpdateWeightsDto(Dictionary<string, int>? Weights) : IValidatableObject
{
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (Weights is null || Weights.Count == 0)
        {
            yield return new ValidationResult("Provide at least one category.");
            yield break;
        }
        if (Weights.Any(w => string.IsNullOrWhiteSpace(w.Key) || w.Key != w.Key.Trim() || w.Key.Length > 50))
            yield return new ValidationResult("Category names must be trimmed and contain 1 to 50 characters.");
        if (Weights.Keys.Distinct(StringComparer.OrdinalIgnoreCase).Count() != Weights.Count)
            yield return new ValidationResult("Category names must be unique, ignoring case.");
        if (Weights.Any(w => w.Value < 0 || w.Value > 100) || Weights.Values.Sum(v => (long)v) != 100)
            yield return new ValidationResult("Weights must be between 0 and 100 and total exactly 100%.");
        if (JsonSerializer.Serialize(Weights).Length > 500)
            yield return new ValidationResult("The category weights exceed the storage limit.");
    }
}
