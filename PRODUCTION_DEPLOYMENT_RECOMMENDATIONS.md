# Production Deployment & Load Balancing Recommendations
## Taaleem Clinic Management System

## 🎯 Current Architecture

- **Framework**: Next.js 14 (App Router)
- **Runtime**: Node.js 20+
- **Database**: PostgreSQL
- **Current Platform**: Windows Server
- **Port**: 5005

---

## 🚀 Recommended Production Architecture

### Option 1: **Recommended - Nginx + PM2 + PostgreSQL** (Best for Linux/Windows)

#### Components:
1. **Nginx** - Reverse Proxy & Load Balancer
2. **PM2** - Process Manager & Cluster Mode
3. **PostgreSQL** - Database (with connection pooling)
4. **Redis** (Optional) - Session store & caching

#### Architecture:
```
Internet
    ↓
[Nginx Load Balancer] (Port 80/443)
    ↓
[PM2 Cluster] (Multiple Node.js instances)
    ├── Instance 1 (Port 5005)
    ├── Instance 2 (Port 5006)
    ├── Instance 3 (Port 5007)
    └── Instance 4 (Port 5008)
    ↓
[PostgreSQL Database] (Connection Pool)
```

#### Benefits:
- ✅ High availability
- ✅ Automatic failover
- ✅ Load distribution
- ✅ Zero-downtime deployments
- ✅ Process monitoring
- ✅ Auto-restart on crashes
- ✅ Built-in clustering

---

### Option 2: **Windows Native - IIS + PM2 + PostgreSQL**

#### Components:
1. **IIS (Internet Information Services)** - Reverse Proxy & Load Balancer
2. **PM2 for Windows** - Process Manager
3. **Application Request Routing (ARR)** - Load balancing module
4. **PostgreSQL** - Database

#### Benefits:
- ✅ Native Windows integration
- ✅ Windows authentication support
- ✅ Easy SSL certificate management
- ✅ Windows performance counters

---

### Option 3: **Containerized - Docker + Kubernetes/Docker Swarm**

#### Components:
1. **Docker** - Containerization
2. **Kubernetes** or **Docker Swarm** - Orchestration
3. **Nginx Ingress** - Load balancing
4. **PostgreSQL** - Database (containerized or managed)

#### Benefits:
- ✅ Maximum scalability
- ✅ Easy horizontal scaling
- ✅ Container isolation
- ✅ Cloud-ready
- ✅ Microservices-ready

---

## 📋 Detailed Recommendations

### 1. Process Manager: **PM2** (Highly Recommended)

#### Why PM2?
- ✅ Cluster mode (multiple instances)
- ✅ Auto-restart on crashes
- ✅ Zero-downtime reloads
- ✅ Built-in load balancer
- ✅ Process monitoring
- ✅ Log management
- ✅ Works on Windows & Linux

#### Installation:
```bash
npm install -g pm2
```

#### Configuration (`ecosystem.config.js`):
```javascript
module.exports = {
  apps: [{
    name: 'taaleem-emr',
    script: './node_modules/next/dist/bin/next',
    args: 'start -p 5005',
    instances: 4, // Number of CPU cores
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5005
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '1G',
    watch: false,
    ignore_watch: ['node_modules', 'logs', '.next']
  }]
};
```

#### PM2 Commands:
```bash
# Start application
pm2 start ecosystem.config.js

# Start with cluster mode
pm2 start ecosystem.config.js -i 4

# Monitor
pm2 monit

# View logs
pm2 logs

# Reload (zero-downtime)
pm2 reload taaleem-emr

# Stop
pm2 stop taaleem-emr

# Save PM2 configuration
pm2 save

# Setup startup script
pm2 startup
pm2 save
```

---

### 2. Load Balancer: **Nginx** (Recommended)

#### Why Nginx?
- ✅ High performance
- ✅ Low memory footprint
- ✅ SSL/TLS termination
- ✅ HTTP/2 support
- ✅ Gzip compression
- ✅ Static file serving
- ✅ Reverse proxy
- ✅ Load balancing algorithms

#### Nginx Configuration (`/etc/nginx/sites-available/taaleem-emr`):

```nginx
# Upstream servers (PM2 cluster instances)
upstream taaleem_backend {
    least_conn;  # Load balancing method
    server localhost:5005;
    server localhost:5006;
    server localhost:5007;
    server localhost:5008;
    
    # Health check
    keepalive 32;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Configuration
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;

    # Client body size
    client_max_body_size 50M;

    # Proxy settings
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;

    # Static files (served directly by Nginx)
    location /_next/static {
        alias /path/to/EMR/.next/static;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    location /public {
        alias /path/to/EMR/public;
        expires 30d;
        add_header Cache-Control "public";
    }

    # API and application routes
    location / {
        proxy_pass http://taaleem_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check endpoint
    location /api/health {
        proxy_pass http://taaleem_backend;
        access_log off;
    }
}
```

#### Load Balancing Methods:
- **least_conn**: Distributes to server with least connections (recommended)
- **ip_hash**: Sticky sessions based on IP
- **round_robin**: Default, distributes evenly
- **weight**: Weighted distribution

---

### 3. Database Connection Pooling

#### Prisma Connection Pooling:
```env
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname?schema=public&connection_limit=20&pool_timeout=20"
```

#### Recommended Settings:
- **connection_limit**: 20-50 (based on server capacity)
- **pool_timeout**: 20 seconds
- **Use PgBouncer** for advanced pooling (optional)

---

### 4. Caching Layer: **Redis** (Optional but Recommended)

#### Why Redis?
- ✅ Session storage
- ✅ API response caching
- ✅ Rate limiting storage
- ✅ Real-time features

#### Installation:
```bash
# Windows
choco install redis-64

# Linux
apt-get install redis-server
```

#### Integration:
```typescript
// Use Redis for session storage
// Use Redis for rate limiting
// Use Redis for caching
```

---

### 5. Monitoring & Logging

#### Recommended Tools:

1. **PM2 Monitoring**
   ```bash
   pm2 install pm2-logrotate
   pm2 set pm2-logrotate:max_size 10M
   pm2 set pm2-logrotate:retain 7
   ```

2. **Application Monitoring**
   - **PM2 Plus** (free tier available)
   - **New Relic**
   - **Datadog**
   - **Sentry** (error tracking)

3. **System Monitoring**
   - **Prometheus + Grafana**
   - **Zabbix**
   - **Nagios**

---

## 🏗️ Recommended Production Setup

### For Windows Server:

#### Step 1: Install PM2
```powershell
npm install -g pm2
npm install -g pm2-windows-startup
pm2-startup install
```

#### Step 2: Install IIS with ARR
1. Install IIS
2. Install Application Request Routing (ARR)
3. Configure URL Rewrite
4. Setup load balancing

#### Step 3: Configure PM2
```bash
pm2 start ecosystem.config.js -i 4
pm2 save
```

#### Step 4: Configure IIS ARR
- Create server farm
- Add multiple backend servers (localhost:5005, 5006, 5007, 5008)
- Configure health checks
- Setup SSL certificates

---

### For Linux Server (Recommended):

#### Step 1: Install Nginx
```bash
sudo apt-get update
sudo apt-get install nginx
```

#### Step 2: Install PM2
```bash
npm install -g pm2
pm2 startup systemd
```

#### Step 3: Configure Application
```bash
pm2 start ecosystem.config.js -i 4
pm2 save
```

#### Step 4: Configure Nginx
```bash
sudo cp nginx-config /etc/nginx/sites-available/taaleem-emr
sudo ln -s /etc/nginx/sites-available/taaleem-emr /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔄 Load Balancing Strategies

### 1. **Round Robin** (Default)
- Distributes requests evenly
- Simple and effective
- Good for equal server capacity

### 2. **Least Connections** (Recommended)
- Routes to server with fewest active connections
- Best for varying request processing times
- Optimal for this application

### 3. **IP Hash** (Sticky Sessions)
- Routes same IP to same server
- Useful for session persistence
- May cause uneven distribution

### 4. **Weighted Round Robin**
- Assigns weights to servers
- Useful for different server capacities
- More control over distribution

---

## 📊 High Availability Setup

### Multi-Server Architecture:

```
                    [Load Balancer]
                    (Nginx/IIS)
                         |
        +----------------+----------------+
        |                |                |
   [Server 1]      [Server 2]      [Server 3]
   (PM2 Cluster)   (PM2 Cluster)   (PM2 Cluster)
        |                |                |
        +----------------+----------------+
                         |
              [PostgreSQL Database]
              (Primary + Replica)
```

### Database Replication:
- **PostgreSQL Streaming Replication**
- **Read replicas** for read-heavy operations
- **Automatic failover** with Patroni or repmgr

---

## 🚀 Deployment Recommendations

### Option A: **Single Server with PM2 Cluster** (Good for Start)

**Setup:**
- 1 Server
- PM2 with 4 instances (cluster mode)
- Nginx as reverse proxy
- PostgreSQL on same server

**Capacity:** ~500-1000 concurrent users

### Option B: **Multi-Server with Load Balancer** (Recommended for Production)

**Setup:**
- 2-4 Application Servers
- 1 Load Balancer (Nginx/IIS)
- 1-2 Database Servers (Primary + Replica)
- Optional: Redis for caching

**Capacity:** ~5000+ concurrent users

### Option C: **Cloud Deployment** (Best for Scalability)

**Setup:**
- AWS/Azure/GCP
- Auto-scaling groups
- Managed databases
- CDN for static assets
- Container orchestration (Kubernetes)

**Capacity:** Unlimited (auto-scales)

---

## 📝 Implementation Steps

### Phase 1: Basic Production Setup
1. ✅ Install PM2
2. ✅ Configure PM2 cluster mode
3. ✅ Setup process monitoring
4. ✅ Configure auto-restart

### Phase 2: Load Balancing
1. ✅ Install Nginx or configure IIS ARR
2. ✅ Setup reverse proxy
3. ✅ Configure SSL/TLS
4. ✅ Setup health checks

### Phase 3: High Availability
1. ✅ Add multiple application servers
2. ✅ Configure database replication
3. ✅ Setup failover mechanisms
4. ✅ Implement monitoring

### Phase 4: Optimization
1. ✅ Add Redis caching
2. ✅ Optimize database queries
3. ✅ Implement CDN
4. ✅ Setup advanced monitoring

---

## 🎯 Recommended Tech Stack for Production

### Minimum Requirements:
- **PM2** - Process management
- **Nginx** or **IIS ARR** - Load balancing
- **PostgreSQL** - Database (with connection pooling)

### Recommended Additions:
- **Redis** - Caching & session storage
- **PM2 Plus** or **New Relic** - Monitoring
- **Sentry** - Error tracking
- **CloudFlare** or **AWS CloudFront** - CDN

### Enterprise Level:
- **Kubernetes** - Container orchestration
- **Docker** - Containerization
- **PostgreSQL HA** - Database high availability
- **Elasticsearch** - Log aggregation
- **Grafana** - Metrics visualization

---

## 📋 Configuration Files

### PM2 Ecosystem Config (`ecosystem.config.js`):
```javascript
module.exports = {
  apps: [{
    name: 'taaleem-emr',
    script: './node_modules/next/dist/bin/next',
    args: 'start -p 5005',
    instances: 'max', // Use all CPU cores
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5005
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '1G',
    watch: false
  }]
};
```

### Nginx Load Balancer Config:
See detailed configuration above.

---

## 🔍 Monitoring Checklist

- [ ] Server CPU/Memory usage
- [ ] Application response times
- [ ] Database connection pool status
- [ ] Error rates
- [ ] Request throughput
- [ ] SSL certificate expiration
- [ ] Disk space usage
- [ ] Network latency

---

## 💡 Best Practices

1. **Always use PM2 cluster mode** for production
2. **Implement health checks** at load balancer level
3. **Use connection pooling** for database
4. **Enable SSL/TLS** for all traffic
5. **Monitor application metrics** continuously
6. **Setup automated backups** for database
7. **Implement rate limiting** at load balancer
8. **Use CDN** for static assets
9. **Enable compression** (gzip/brotli)
10. **Setup log rotation** to prevent disk fill

---

## 🎯 Summary

### **Best Choice for This Application:**

**Recommended Stack:**
1. **PM2** - Process management & clustering
2. **Nginx** - Load balancing & reverse proxy
3. **PostgreSQL** - Database with connection pooling
4. **Redis** (Optional) - Caching layer

**Why This Stack?**
- ✅ Proven and reliable
- ✅ Easy to implement
- ✅ Works on Windows and Linux
- ✅ Cost-effective
- ✅ Scalable
- ✅ Production-ready
- ✅ Good performance
- ✅ Easy maintenance

This combination provides excellent performance, reliability, and scalability for the Taaleem Clinic Management System.

