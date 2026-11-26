// ============================================================================
// FILE:    Services/Common/ServiceResult.cs
// PURPOSE: What a service method returns: either a value, or an error (kind + message).
//          Services never build HTTP responses; ApiControllerBase turns a result into one.
//
//   return dto;                                   // success (200)
//   return ServiceResult<ClassDto>.Created(dto, "/api/classes/5/roster");   // 201
//   return Fail.NotFound("Class not found.");     // error -> 404 { error }
// ============================================================================

namespace Edutrack.Services
{
    public enum ErrorKind { BadRequest, Unauthorized, Forbidden, NotFound, Conflict, Locked }

    public record ServiceError(ErrorKind Kind, string Message);

    public class ServiceResult<T>
    {
        public T? Value { get; }
        public ServiceError? Error { get; }
        public string? CreatedLocation { get; }
        public bool Succeeded => Error is null;

        private ServiceResult(T? value, ServiceError? error, string? createdLocation)
        {
            Value = value;
            Error = error;
            CreatedLocation = createdLocation;
        }

        public static ServiceResult<T> Ok(T value) => new(value, null, null);
        public static ServiceResult<T> Created(T value, string location) => new(value, null, location);

        public static implicit operator ServiceResult<T>(T value) => Ok(value);
        public static implicit operator ServiceResult<T>(ServiceError error) => new(default, error, null);
    }

    // Short names for the errors services return.
    public static class Fail
    {
        public static ServiceError BadRequest(string message) => new(ErrorKind.BadRequest, message);
        public static ServiceError Unauthorized(string message) => new(ErrorKind.Unauthorized, message);
        public static ServiceError Forbidden(string message) => new(ErrorKind.Forbidden, message);
        public static ServiceError NotFound(string message) => new(ErrorKind.NotFound, message);
        public static ServiceError Conflict(string message) => new(ErrorKind.Conflict, message);
        public static ServiceError Locked(string message) => new(ErrorKind.Locked, message);
    }
}
