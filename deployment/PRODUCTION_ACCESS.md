# Production Server Access Information
## Taaleem Clinic Management System

---

## 🌐 Server Access URLs

### Local Access
- **URL**: `http://localhost:5005`
- **Access**: Only from the server machine itself

### Intranet Access
- **URL**: `http://[SERVER_IP]:5005`
- **Access**: All devices on the same network/intranet

### Find Server IP Address

**Windows:**
```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.*" } | Select-Object IPAddress
```

**Linux:**
```bash
hostname -I | awk '{print $1}'
# or
ip addr show | grep "inet " | grep -v 127.0.0.1
```

---

## 🚀 Starting Production Server

### Option 1: Using npm (Recommended for Intranet)
```bash
npm start
```

This will start the server bound to `0.0.0.0:5005`, making it accessible on the intranet.

### Option 2: Using PM2 (Recommended for Production)
```bash
pm2 start deployment/pm2/ecosystem.config.js
```

PM2 will manage the process and provide automatic restarts.

### Option 3: Using NGINX + PM2 (Full Production Setup)
See [deployment/README.md](./README.md) for complete setup instructions.

---

## 🔒 Security Considerations

### Intranet Access
- The server is accessible to all devices on the same network
- Ensure proper firewall rules are configured
- Consider using NGINX with SSL/TLS for encrypted connections

### Firewall Configuration

**Windows Firewall:**
```powershell
# Allow port 5005 through firewall
New-NetFirewallRule -DisplayName "Taaleem EMR - Port 5005" -Direction Inbound -LocalPort 5005 -Protocol TCP -Action Allow
```

**Linux Firewall (UFW):**
```bash
sudo ufw allow 5005/tcp
```

---

## 📊 Server Status

### Check if Server is Running
```bash
# Windows
netstat -ano | findstr :5005

# Linux
netstat -tulpn | grep 5005
```

### Health Check
```bash
curl http://[SERVER_IP]:5005/api/health
```

---

## 🔧 Configuration

### Binding Address
The server is configured to bind to `0.0.0.0`, which means:
- ✅ Accessible on all network interfaces
- ✅ Accessible from other devices on the network
- ⚠️ Ensure firewall allows connections

### Port Configuration
- **Default Port**: 5005
- **Configurable**: Set `PORT` environment variable

### Environment Variables
Ensure `.env` file has:
```env
NODE_ENV=production
PORT=5005
DATABASE_URL=postgresql://...
JWT_SECRET=...
```

---

## 🌍 Network Access Scenarios

### Scenario 1: Same Local Network (Intranet)
- All devices on the same LAN can access
- Use server's local IP address
- Example: `http://192.168.1.100:5005`

### Scenario 2: Different Network
- Requires port forwarding on router
- Use public IP or domain name
- Consider using NGINX reverse proxy with SSL

### Scenario 3: Internet Access
- **NOT RECOMMENDED** without proper security
- Use NGINX with SSL/TLS
- Implement proper authentication
- Configure firewall rules

---

## 📝 Quick Access Guide for Users

### For End Users:
1. Open a web browser
2. Navigate to: `http://[SERVER_IP]:5005`
3. Login with your credentials

### Finding the Server IP:
Ask your system administrator for the server IP address, or:
- Check with network administrator
- Look for "Server Access Information" document
- Contact IT support

---

## ⚠️ Troubleshooting

### Cannot Access from Other Devices

1. **Check Firewall**:
   - Ensure port 5005 is allowed
   - Check both Windows Firewall and router firewall

2. **Check Server Status**:
   ```bash
   netstat -ano | findstr :5005
   ```

3. **Check IP Address**:
   - Verify correct IP address
   - Ensure devices are on same network

4. **Check Server Binding**:
   - Server must bind to `0.0.0.0` (not `127.0.0.1`)
   - Check `package.json` start script

### Connection Refused

- Server may not be running
- Port may be blocked by firewall
- Check server logs for errors

---

## 🔐 Security Recommendations

1. **Use HTTPS**: Configure NGINX with SSL/TLS
2. **Firewall Rules**: Restrict access to authorized IPs
3. **VPN Access**: Consider VPN for remote access
4. **Network Segmentation**: Isolate application network
5. **Regular Updates**: Keep server and dependencies updated

---

## 📞 Support

For access issues:
1. Verify server is running
2. Check firewall rules
3. Verify network connectivity
4. Contact system administrator

---

**Last Updated**: December 2024

