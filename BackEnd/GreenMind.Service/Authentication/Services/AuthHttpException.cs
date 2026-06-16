namespace GreenMind.Service.Authentication.Services
{
    public class AuthHttpException : Exception
    {
        public int StatusCode { get; }
        public AuthHttpException(int statusCode, string message) : base(message)
        {
            StatusCode = statusCode;
        }
    }
}