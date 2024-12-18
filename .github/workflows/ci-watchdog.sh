name: ci-watchdog

on: push

permissions:
  id-token: write
  contents: write
  packages: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Assume role
        uses: aws-actions/configure-aws-credentials@v1-node16
        with:
          aws-region: us-east-1
          role-to-assume: arn:aws:iam::${{ secrets.DEVOPS_ACCOUNT_ID }}:role/github-actions
          role-session-name: GitHubActions-${{ github.run_id }}
      - name: Deploy
        run: |
          cd infra/watchdog
          npm ci
          npm run deploy
