# IIS Application Request Routing (ARR) Setup Guide
# For Windows Server with IIS

## Prerequisites

1. IIS 7.0 or later installed
2. Application Request Routing (ARR) 3.0 module
3. URL Rewrite module 2.0

## Installation Steps

### 1. Install IIS Features

```powershell
# Install IIS with required features
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServer
Enable-WindowsOptionalFeature -Online -FeatureName IIS-CommonHttpFeatures
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpErrors
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ApplicationInit
```

### 2. Install ARR and URL Rewrite

Download and install from:
- **Application Request Routing**: https://www.iis.net/downloads/microsoft/application-request-routing
- **URL Rewrite**: https://www.iis.net/downloads/microsoft/url-rewrite

Or use Web Platform Installer (WebPI):
```powershell
# Download WebPI and install ARR
# Or use Chocolatey:
choco install urlrewrite -y
choco install iis-arr -y
```

### 3. Configure Server Farm

1. Open IIS Manager
2. Select the server node
3. Double-click "Application Request Routing Cache"
4. Click "Server Farms" in the right panel
5. Click "Create Server Farm" in the right panel
6. Enter farm name: `taaleem-emr-backend`
7. Click "Next"

### 4. Add Servers

Add the following servers (all pointing to localhost with different ports if using multi-port setup):

**Option A: Single Port (PM2 Cluster Mode - Recommended)**
- Server: `localhost:5005`
- Weight: 100

**Option B: Multiple Ports**
- Server: `localhost:5005` (Weight: 25)
- Server: `localhost:5006` (Weight: 25)
- Server: `localhost:5007` (Weight: 25)
- Server: `localhost:5008` (Weight: 25)

### 5. Configure Health Checks

1. Select the server farm
2. Click "Health Test" in the right panel
3. Enable health checks
4. Set URL: `/api/health`
5. Set interval: 30 seconds
6. Set timeout: 5 seconds
7. Set response match: `200`

### 6. Configure Load Balancing

1. Select the server farm
2. Click "Load Balance" in the right panel
3. Choose algorithm:
   - **Least Current Requests** (Recommended)
   - Or **Weighted Round Robin**

### 7. Configure URL Rewrite Rule

1. Select your website in IIS Manager
2. Double-click "URL Rewrite"
3. Click "Add Rule" → "Reverse Proxy"
4. Enter inbound rule:
   - Pattern: `(.*)`
   - Rewrite URL: `http://taaleem-emr-backend/{R:1}`
5. Enable "Stop processing of subsequent rules"

### 8. Configure SSL/TLS

1. In IIS Manager, select your website
2. Click "Bindings"
3. Add HTTPS binding:
   - Port: 443
   - SSL certificate: Select your certificate
4. Configure SSL Settings:
   - Require SSL: Optional (or Required for production)
   - SSL Protocols: TLS 1.2, TLS 1.3

### 9. Configure Request Filtering

1. Select your website
2. Double-click "Request Filtering"
3. Set maximum allowed content length: 52428800 (50MB)

## Configuration Files

### web.config (for your website)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <rule name="ReverseProxyInboundRule" stopProcessing="true">
                    <match url="(.*)" />
                    <action type="Rewrite" url="http://taaleem-emr-backend/{R:1}" />
                </rule>
            </rules>
        </rewrite>
        <security>
            <requestFiltering>
                <requestLimits maxAllowedContentLength="52428800" />
            </requestFiltering>
        </security>
    </system.webServer>
</configuration>
```

## Testing

1. Start your PM2 application: `pm2 start ecosystem.config.js -i max`
2. Test health endpoint: `curl http://localhost:5005/api/health`
3. Test through IIS: `curl https://your-domain.com/api/health`

## Monitoring

- Use IIS Manager to monitor server farm health
- Check ARR logs in: `C:\inetpub\logs\LogFiles\`
- Monitor PM2: `pm2 monit`

## Troubleshooting

### Issue: 502 Bad Gateway
- Check if PM2 application is running: `pm2 list`
- Verify backend URL is correct
- Check firewall settings

### Issue: Health checks failing
- Verify `/api/health` endpoint is accessible
- Check health test URL and response match settings

### Issue: SSL certificate errors
- Verify certificate is installed in Windows Certificate Store
- Check certificate binding in IIS

## Performance Tuning

1. **Connection Pooling**: Configure in ARR server farm settings
2. **Caching**: Enable ARR disk cache for static content
3. **Compression**: Enable dynamic and static compression in IIS
4. **Keep-Alive**: Configure in ARR server farm settings

## Security Recommendations

1. Enable HTTPS only (redirect HTTP to HTTPS)
2. Configure security headers via URL Rewrite outbound rules
3. Enable request filtering
4. Configure IP restrictions if needed
5. Enable logging for security auditing

