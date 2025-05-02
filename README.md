# Weather Application with Authentication

A React Native Expo app that provides weather information with user authentication and location saving using Supabase.

## Features

- **User Authentication**: Sign up and login with email/password
- **Weather Dashboard**: View current weather conditions for any location
- **Weather Forecast**: 7-day forecast with detailed information
- **Weather Map**: Interactive map to select and save locations
- **Location Saving**: Save favorite locations to your profile
- **User Profile**: View and manage your saved locations

## Technologies Used

- React Native with Expo
- Supabase for authentication and database
- React Navigation for routing
- Expo Location for geolocation
- React Native Maps for map interactions

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Weather-Application
```

2. Install dependencies:
```bash
npm install
```

3. Start the application:
```bash
npm start
```

4. Use Expo Go app on your device or an emulator to run the application.

## Supabase Configuration

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions on setting up the Supabase backend.

## Project Structure

- `assets/` - Images and app icons
- `components/` - UI components (screens, shared components)
- `src/`
  - `api/` - API calls for weather data
  - `context/` - Context providers (auth)
  - `navigation/` - Navigation configuration
  - `supabase.js` - Supabase client configuration
  - `db/` - SQL files for database setup

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Weather data provided by OpenWeatherMap (mock data for now)
- Built with React Native and Expo
- Database and authentication by Supabase
