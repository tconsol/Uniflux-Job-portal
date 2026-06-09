const Eureka = require('eureka-js-client').Eureka;

let eurekaClient = null;

function initEureka() {
  const host = process.env.EUREKA_HOST;
  if (!host || host === 'localhost') {
    // Skip Eureka registration in dev when no server is running
    console.log('Eureka: no remote host configured, skipping registration');
    return;
  }

  eurekaClient = new Eureka({
    instance: {
      app: process.env.EUREKA_APP_NAME || 'UNIFLUX-JOB-PORTAL',
      hostName: process.env.EUREKA_INSTANCE_HOST || 'localhost',
      ipAddr: '127.0.0.1',
      port: {
        '$': parseInt(process.env.EUREKA_INSTANCE_PORT) || 5000,
        '@enabled': true,
      },
      vipAddress: process.env.EUREKA_APP_NAME || 'UNIFLUX-JOB-PORTAL',
      dataCenterInfo: {
        '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
        name: 'MyOwn',
      },
    },
    eureka: {
      host,
      port: parseInt(process.env.EUREKA_PORT) || 8761,
      servicePath: '/eureka/apps/',
      maxRetries: 3,
      requestRetryDelay: 2000,
    },
  });

  eurekaClient.start((error) => {
    if (error) {
      console.error('Eureka registration failed:', error.message);
    } else {
      console.log('Registered with Eureka server');
    }
  });
}

function getServiceUrl(serviceName) {
  if (!eurekaClient) return null;
  try {
    const instances = eurekaClient.getInstancesByAppId(serviceName);
    if (!instances || instances.length === 0) return null;
    const instance = instances[0];
    const host = instance.hostName || instance.ipAddr;
    const port = instance.port['$'];
    return `http://${host}:${port}`;
  } catch (err) {
    return null;
  }
}

module.exports = { initEureka, getServiceUrl };
