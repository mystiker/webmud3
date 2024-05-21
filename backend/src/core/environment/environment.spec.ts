jest.mock('./utils/resolve-modulepath', () => {
  return {
    resolveModulePath: jest.fn(() => '/path/to/project/root'),
  };
});

describe('Environment', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();

    process.env = { ...originalEnv }; // Reset process.env to its original state
  });

  afterAll(() => {
    process.env = originalEnv; // Restore process.env
  });

  const getFreshEnvironmentInstance = async () => {
    // Dynamically import the Environment class to ensure a fresh instance
    const { Environment } = await import('./environment');

    return Environment.getInstance();
  };

  it('should create an instance of Environment', async () => {
    process.env.HOST = 'localhost';

    process.env.PORT = '3000';

    process.env.CHARSET = 'utf8';

    const env = await getFreshEnvironmentInstance();

    const { Environment } = await import('./environment');

    expect(env).toBeInstanceOf(Environment);
  });

  it('should initialize environment variables correctly', async () => {
    process.env.HOST = 'localhost';

    process.env.PORT = '3000';

    process.env.CHARSET = 'utf8';

    const env = await getFreshEnvironmentInstance();

    expect(env.host).toBe('localhost');

    expect(env.port).toBe(3000);

    expect(env.charset).toBe('utf8');
  });

  it('should handle optional TLS configuration', async () => {
    process.env.HOST = 'localhost';

    process.env.PORT = '3000';

    process.env.CHARSET = 'utf8';

    process.env.TLS_CERT = 'cert_value';

    process.env.TLS_KEY = 'key_value';

    const env = await getFreshEnvironmentInstance();

    expect(env.tls).toEqual({
      cert: 'cert_value',
      key: 'key_value',
    });
  });

  it('should handle missing TLS configuration gracefully', async () => {
    process.env.HOST = 'localhost';

    process.env.PORT = '3000';

    process.env.CHARSET = 'utf8';

    const env = await getFreshEnvironmentInstance();

    expect(env.tls).toBeUndefined();
  });

  it('should use default charset if not set', async () => {
    process.env.HOST = 'localhost';

    process.env.PORT = '3000';

    const env = await getFreshEnvironmentInstance();

    expect(env.charset).toBe('utf8');
  });

  it('should set projectRoot correctly', async () => {
    process.env.HOST = 'localhost';

    process.env.PORT = '3000';

    process.env.CHARSET = 'utf8';

    const env = await getFreshEnvironmentInstance();

    expect(env.projectRoot).toBe('/path/to/project/root');
  });
});
