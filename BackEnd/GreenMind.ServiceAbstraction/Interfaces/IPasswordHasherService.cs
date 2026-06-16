namespace GreenMind.ServiceAbstraction.Interfaces
{
    public interface IPasswordHasherService
    {
        string Hash(string password);
        bool Verify(string hashedPassword, string providedPassword);
    }
}
