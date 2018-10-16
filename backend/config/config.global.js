var config = module.exports = {};

config.env = 'development';

config.mudfamilies = {
    unitopia : {
        MXP : true,
        GMCP : true,
    }
}

config.tls = process.env.TLS || false;
config.tls_cert = process.env.TLS_CERT || '';
config.tls_key = process.env.TLS_KEY || '',

config.muds = {};