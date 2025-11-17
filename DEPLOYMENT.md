# Bill Blaze - Deployment Guide

## 🚀 Deployment Options

This guide covers deploying Bill Blaze to production environments.

---

## Option 1: Vercel (Recommended)

### Why Vercel?
- ✅ Zero configuration for Vite apps
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Free tier available
- ✅ Easy custom domains

### Steps

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Build the Project**
```bash
npm run build
```

3. **Deploy**
```bash
vercel
```

4. **Follow Prompts**
- Link to existing project or create new
- Set build command: `npm run build`
- Set output directory: `dist`

5. **Production Deployment**
```bash
vercel --prod
```

### Environment Variables
Add in Vercel dashboard:
- `VITE_OPENAI_API_KEY` (optional - users can enter in UI)
- `VITE_DEFAULT_CLIENT_PREFIX` (optional)

---

## Option 2: Netlify

### Steps

1. **Install Netlify CLI**
```bash
npm install -g netlify-cli
```

2. **Build**
```bash
npm run build
```

3. **Deploy**
```bash
netlify deploy
```

4. **Production**
```bash
netlify deploy --prod
```

### Configuration
Create `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## Option 3: GitHub Pages

### Steps

1. **Install gh-pages**
```bash
npm install --save-dev gh-pages
```

2. **Update package.json**
```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  },
  "homepage": "https://yourusername.github.io/bill-blaze"
}
```

3. **Update vite.config.ts**
```typescript
export default defineConfig({
  base: '/bill-blaze/',
  // ... rest of config
})
```

4. **Deploy**
```bash
npm run deploy
```

---

## Option 4: Docker

### Dockerfile
```dockerfile
# Build stage
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Enable gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

### Build and Run
```bash
# Build image
docker build -t bill-blaze .

# Run container
docker run -p 8080:80 bill-blaze
```

---

## Option 5: AWS S3 + CloudFront

### Steps

1. **Build**
```bash
npm run build
```

2. **Create S3 Bucket**
```bash
aws s3 mb s3://bill-blaze-app
```

3. **Upload**
```bash
aws s3 sync dist/ s3://bill-blaze-app --delete
```

4. **Enable Static Website Hosting**
```bash
aws s3 website s3://bill-blaze-app --index-document index.html --error-document index.html
```

5. **Create CloudFront Distribution**
- Origin: S3 bucket
- Viewer Protocol Policy: Redirect HTTP to HTTPS
- Default Root Object: index.html

---

## Pre-Deployment Checklist

### Code Quality
- [ ] Run `npm run lint` - no errors
- [ ] Run `npm run build` - successful
- [ ] Test production build locally with `npm run preview`
- [ ] All TypeScript errors resolved
- [ ] No console errors in browser

### Configuration
- [ ] Update `VITE_APP_NAME` if needed
- [ ] Set appropriate `VITE_DEFAULT_CLIENT_PREFIX`
- [ ] Remove any development API keys
- [ ] Update README with deployment URL

### Security
- [ ] API keys not hardcoded
- [ ] HTTPS enabled
- [ ] CORS configured if needed
- [ ] Content Security Policy set

### Performance
- [ ] Images optimized
- [ ] Code splitting enabled (Vite default)
- [ ] Gzip/Brotli compression enabled
- [ ] CDN configured

### Testing
- [ ] Test on Chrome
- [ ] Test on Firefox
- [ ] Test on Safari
- [ ] Test on mobile devices
- [ ] Test file upload
- [ ] Test API key validation
- [ ] Test rule extraction
- [ ] Test CSV export

---

## Post-Deployment

### Monitoring
- Set up error tracking (e.g., Sentry)
- Monitor API usage on OpenAI dashboard
- Track deployment metrics

### User Onboarding
- Provide API key setup instructions
- Share Quick Start guide
- Offer sample policy documents

### Maintenance
- Monitor OpenAI API costs
- Update dependencies regularly
- Review user feedback
- Plan feature enhancements

---

## Environment Variables

### Required
None - all configuration can be done in UI

### Optional
```bash
# OpenAI API Key (users can enter in UI)
VITE_OPENAI_API_KEY=sk-...

# Default client prefix
VITE_DEFAULT_CLIENT_PREFIX=AU

# App branding
VITE_APP_NAME="Bill Blaze"
VITE_APP_DESCRIPTION="AI-Powered Claim Rule Management"

# File upload limits
VITE_MAX_FILE_SIZE_MB=50
VITE_ALLOWED_FILE_TYPES=pdf,docx,doc,csv
```

---

## Custom Domain

### Vercel
1. Go to project settings
2. Add domain
3. Configure DNS (A or CNAME record)
4. Wait for SSL certificate

### Netlify
1. Go to domain settings
2. Add custom domain
3. Configure DNS
4. Enable HTTPS

### CloudFront
1. Request SSL certificate in ACM
2. Add alternate domain name to distribution
3. Update DNS to point to CloudFront
4. Wait for propagation

---

## Performance Optimization

### Build Optimization
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-tabs'],
        }
      }
    }
  }
})
```

### Caching Headers
```nginx
# nginx.conf
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

## Troubleshooting

### Build Fails
- Check Node.js version (18+)
- Clear `node_modules` and reinstall
- Check for TypeScript errors
- Verify all imports are correct

### 404 on Refresh
- Configure server to serve `index.html` for all routes
- Add redirect rules (see platform-specific configs above)

### API Calls Fail
- Check CORS configuration
- Verify HTTPS is enabled
- Check API key is valid
- Monitor OpenAI API status

### Large Bundle Size
- Enable code splitting
- Lazy load routes
- Optimize images
- Remove unused dependencies

---

## Cost Estimation

### Hosting (Monthly)
- **Vercel Free**: $0
- **Netlify Free**: $0
- **AWS S3 + CloudFront**: $1-5
- **Docker on VPS**: $5-20

### OpenAI API (Monthly)
- **Light use** (10-20 docs): $5-10
- **Medium use** (50-100 docs): $20-50
- **Heavy use** (200+ docs): $100-200

### Total Monthly Cost
- **Starter**: $5-15
- **Professional**: $25-75
- **Enterprise**: $100-250

---

## Scaling Considerations

### For High Volume
- Implement request queuing
- Add rate limiting
- Cache frequently used lookups
- Consider batch processing
- Monitor API quotas

### For Multiple Users
- Add authentication
- Implement user management
- Add usage tracking
- Consider database for rules
- Add collaboration features

---

## Backup & Recovery

### Data Backup
- Export lookup tables regularly
- Save extracted rules to CSV
- Version control configuration
- Document custom tags

### Disaster Recovery
- Keep deployment scripts
- Document environment variables
- Maintain dependency versions
- Test restore procedures

---

## Security Best Practices

### API Keys
- Never commit API keys to git
- Use environment variables
- Rotate keys regularly
- Monitor usage for anomalies

### Application Security
- Keep dependencies updated
- Enable HTTPS only
- Implement CSP headers
- Sanitize user inputs
- Validate file uploads

---

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Netlify Docs**: https://docs.netlify.com
- **Vite Deployment**: https://vitejs.dev/guide/static-deploy.html
- **OpenAI Status**: https://status.openai.com

---

**Ready to deploy Bill Blaze to production!** 🚀
