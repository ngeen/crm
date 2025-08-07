#!/bin/bash

echo "Setting up Sanayi CRM..."

# Install backend dependencies
echo "Installing backend dependencies..."
npm install

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd client
npm install
cd ..

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOF
# Server Configuration
PORT=5000
NODE_ENV=development
SESSION_SECRET=dev-secret-key-change-in-production

# Client URL
CLIENT_URL=http://localhost:3000

# Google OAuth2 Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth2 Configuration
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
EOF
    echo ".env file created. Please update with your OAuth2 credentials."
fi

echo "Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update the .env file with your OAuth2 credentials"
echo "2. Run 'npm run dev' to start the application"
echo "3. Open http://localhost:3000 in your browser" 