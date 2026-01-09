# AI Coding Guidelines for Resort Food Ordering App

## Architecture Overview
- **Expo Router**: File-based routing in `/app` directory (e.g., `/app/venue/[id].tsx` for dynamic venue pages)
- **State Management**: React Context via `AppContext` for cart, orders, delivery locations
- **Backend**: Supabase with tables: `hospitality_center`, `merchant`, `product`, `product_category`, `ordering_location`, `order`, `order_product`
- **Styling**: NativeWind (Tailwind CSS) with custom color palette: `cream`, `sand`, `charcoal`, `coral`, `turquoise`

## Key Patterns
- **Venue Cart Restriction**: Cart items must belong to same venue (`cartVenueId` in context prevents mixing orders)
- **Menu Categories**: Products filtered by `category_id` with horizontal scroll tabs in venue pages
- **Delivery Locations**: Resort-specific locations (pool, cabana, table, beach) stored in `ordering_location` table
- **Safe Areas**: Use `SafeAreaView` with `edges={['top']}` for proper iOS/Android spacing
- **Icons**: Lucide React Native icons (e.g., `ArrowLeft`, `Clock`, `Star`)
- **Data Fetching**: Database functions in `/lib/database.ts` using Supabase client

## Component Structure
- **Layout**: `BottomTabBar` component for navigation
- **Cards**: `MenuItemCard` for product display with add-to-cart functionality
- **Context Usage**: Import `useApp()` hook for cart/order state management
- **Navigation**: `expo-router` with `useLocalSearchParams()` for dynamic routes

## Database Schema Notes
- Merchants (venues) belong to hospitality centers
- Products have categories and belong to merchants
- Orders link to ordering locations (delivery spots)
- Use `getMerchantById()`, `getProductsByMerchant()`, `getProductCategories()` for venue pages

## Development Commands
- `npm start` / `npx expo start`: Start development server
- `npm run android` / `npm run ios`: Platform-specific builds
- `npm test`: Jest tests with `jest-expo` preset
- `npm run lint`: ESLint via Expo

## File Organization
- `/components/`: Reusable UI components
- `/context/`: App-wide state (cart, orders, locations)
- `/lib/`: Database functions and Supabase client
- `/types/`: TypeScript interfaces for app and database types
- `/app/`: Expo Router pages (file-based routing)

## Styling Conventions
- Custom colors via Tailwind config (avoid hardcoded hex values)
- Border radius: `card: '16px'`, `button: '12px'`
- Box shadows: `soft`, `lift` for elevation
- Background: `bg-cream` for main screens, `bg-white` for cards/sections</content>
<parameter name="filePath">/app/.github/copilot-instructions.md