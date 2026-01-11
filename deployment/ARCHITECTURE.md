# Production Architecture Diagram
## NGINX Reverse Proxy + PM2 Load Balancer

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTPS (Port 443)
                             │ HTTP → HTTPS Redirect (Port 80)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NGINX REVERSE PROXY                          │
│                    (Load Balancer)                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Features:                                                  │  │
│  │ • SSL/TLS Termination                                      │  │
│  │ • Load Balancing (least_conn)                             │  │
│  │ • Rate Limiting                                            │  │
│  │ • Security Headers                                         │  │
│  │ • Static File Serving                                      │  │
│  │ • Health Checks                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP (Internal)
                             │ Load Distribution
                             ▼
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  PM2 Instance│    │  PM2 Instance│    │  PM2 Instance│
│      #1      │    │      #2      │    │      #3      │
│  Port: 5005  │    │  Port: 5006  │    │  Port: 5007  │
│              │    │              │    │              │
│  Next.js App│    │  Next.js App│    │  Next.js App│
│  Node.js    │    │  Node.js    │    │  Node.js    │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   PostgreSQL Database   │
              │   (Connection Pool)     │
              │                          │
              │  • User Sessions         │
              │  • Application Data      │
              │  • Audit Logs           │
              │  • Security Events       │
              └─────────────────────────┘
```

---

## 🔄 Request Flow

### 1. User Request
```
User Browser → HTTPS Request → NGINX (Port 443)
```

### 2. NGINX Processing
```
NGINX:
  ├── SSL/TLS Termination
  ├── Security Headers Added
  ├── Rate Limiting Check
  ├── Load Balancing Decision
  └── Route to PM2 Instance
```

### 3. PM2 Instance Processing
```
PM2 Instance:
  ├── Receive Request
  ├── Process Application Logic
  ├── Database Query (if needed)
  └── Return Response
```

### 4. Response Flow
```
PM2 Instance → NGINX → User Browser
```

---

## 📊 Load Balancing Strategy

### Algorithm: **Least Connections**

**Why Least Connections?**
- Optimal for varying request processing times
- Distributes load based on actual server load
- Better than round-robin for this application

**How It Works:**
1. NGINX tracks active connections per backend
2. Routes new request to server with fewest connections
3. Automatically handles server failures
4. Health checks ensure only healthy servers receive traffic

### Backend Instances

```
Instance 1: localhost:5005 (PM2 Cluster Worker 0)
Instance 2: localhost:5006 (PM2 Cluster Worker 1)
Instance 3: localhost:5007 (PM2 Cluster Worker 2)
Instance 4: localhost:5008 (PM2 Cluster Worker 3)
```

**Note**: PM2 cluster mode automatically manages multiple instances on the same port (5005) using Node.js cluster module. The multiple ports in NGINX config are for demonstration - in practice, PM2 handles load distribution internally.

---

## 🔒 Security Layers

### Layer 1: NGINX (Edge Security)
- ✅ SSL/TLS Encryption
- ✅ Security Headers
- ✅ Rate Limiting
- ✅ DDoS Protection
- ✅ Access Control

### Layer 2: Application (PM2 Instances)
- ✅ Authentication (JWT)
- ✅ Authorization (RBAC)
- ✅ Input Validation
- ✅ CSRF Protection
- ✅ XSS Prevention

### Layer 3: Database
- ✅ Connection Pooling
- ✅ Parameterized Queries
- ✅ Access Control
- ✅ Audit Logging

---

## 📈 Scalability

### Horizontal Scaling

```
Current Setup:
  ┌─────────┐
  │ Server 1│
  │ NGINX   │
  │ PM2 x4  │
  │ DB      │
  └─────────┘

Scaled Setup:
  ┌─────────┐    ┌─────────┐    ┌─────────┐
  │ Server 1│    │ Server 2│    │ Server 3│
  │ NGINX   │    │ PM2 x4  │    │ PM2 x4  │
  │ PM2 x4  │    │         │    │         │
  └────┬────┘    └────┬────┘    └────┬────┘
       │              │              │
       └──────────────┼──────────────┘
                      │
              ┌───────┴───────┐
              │ Load Balancer │
              │   (NGINX)     │
              └───────┬───────┘
                      │
              ┌───────┴───────┐
              │   Database     │
              │  (PostgreSQL)  │
              └────────────────┘
```

### Vertical Scaling

- Increase PM2 instances per server
- Increase server resources (CPU, RAM)
- Optimize database performance
- Add caching layer (Redis)

---

## 🎯 Performance Characteristics

### Expected Performance

- **Concurrent Users**: 500-1000+ (depending on server)
- **Requests/Second**: 500-1000+
- **Response Time**: < 200ms (average)
- **Uptime**: 99.9%+ (with PM2 auto-recovery)

### Resource Usage

**Per PM2 Instance:**
- Memory: 200-500MB
- CPU: 10-20% (under load)

**NGINX:**
- Memory: 50-100MB
- CPU: 5-10% (under load)

**Total (4 instances + NGINX):**
- Memory: ~2GB
- CPU: ~50-80% (under load)

---

## 🔍 Monitoring Points

### Key Metrics to Monitor

1. **NGINX Metrics**
   - Request rate
   - Response times
   - Error rates
   - Active connections
   - Rate limit hits

2. **PM2 Metrics**
   - Instance status
   - Memory usage
   - CPU usage
   - Restart count
   - Uptime

3. **Application Metrics**
   - Response times
   - Error rates
   - Database query times
   - Active sessions

4. **System Metrics**
   - Server CPU/Memory
   - Disk I/O
   - Network I/O
   - Database connections

---

## 🚨 Failure Scenarios & Recovery

### Scenario 1: PM2 Instance Crash
**Recovery**: PM2 automatically restarts the instance
**Impact**: Minimal (other instances handle traffic)

### Scenario 2: NGINX Failure
**Recovery**: Systemd/service manager restarts NGINX
**Impact**: Brief downtime (< 5 seconds)

### Scenario 3: Database Connection Loss
**Recovery**: Application retries, PM2 restarts if needed
**Impact**: Temporary service degradation

### Scenario 4: High Traffic
**Recovery**: Rate limiting protects backend, load distributed
**Impact**: Some requests may be rate-limited

---

## 📋 Configuration Summary

### NGINX Configuration
- **Upstream**: 4 PM2 instances
- **Load Balancing**: least_conn
- **Rate Limiting**: Login (5/min), API (100/min)
- **SSL/TLS**: TLS 1.2+, strong ciphers
- **Security Headers**: All required headers

### PM2 Configuration
- **Instances**: max (all CPU cores)
- **Mode**: cluster
- **Auto-restart**: Enabled
- **Memory Limit**: 1GB per instance
- **Logging**: JSON format, rotation enabled

---

## ✅ Architecture Benefits

1. **High Availability**: Multiple instances ensure uptime
2. **Load Distribution**: Even load across instances
3. **Auto-Recovery**: Automatic restart on failures
4. **Security**: Multiple security layers
5. **Performance**: Optimized for production
6. **Scalability**: Easy to add more instances
7. **Compliance**: Meets all Malaffi requirements

---

**Last Updated**: December 2024

