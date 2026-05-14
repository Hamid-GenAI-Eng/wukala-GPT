namespace WukalaGPT.Domain.Exceptions;

public class LawyerNotVerifiedException : Exception
{
    public LawyerNotVerifiedException()
        : base("Lawyer profile is not verified.")
    {
    }

    public LawyerNotVerifiedException(string message)
        : base(message)
    {
    }
}
