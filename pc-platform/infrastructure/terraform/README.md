# Terraform — PC Platform Infrastructure

## Status: Placeholder

Terraform configuration for cloud infrastructure will be added in a future phase.

## Planned Resources

- Google Cloud SQL (PostgreSQL 16)
- Google Cloud Run (API, Web, Admin, Compatibility Engine)
- Google Cloud Armor (WAF)
- Google Cloud CDN
- VPC and networking
- Secret Manager
- Cloud Storage (product images)

## Environment

Target cloud: **Google Cloud Platform (GCP)**  
Region: `asia-south1` (Mumbai — lowest latency for India)

## Getting Started (future)

```bash
terraform init
terraform plan -var-file=environments/production.tfvars
terraform apply -var-file=environments/production.tfvars
```
