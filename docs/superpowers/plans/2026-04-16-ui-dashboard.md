# UI Dashboard Design Plan

## 1. Goal
Build a modern, feature-rich flight search dashboard that clearly displays the lowest base fares vs. effective prices after applying credit card/bank offers, emphasizing the savings and OTA sources.

## 2. Key Components
1. **Search Header (Hero Section)**:
   - Modern inputs for Origin, Destination, and Date (using Shadcn UI/Radix).
   - "Search Flights" button that triggers the `getAndTrackFlights` server action.

2. **Flight Results Grid**:
   - A list of `FlightCard` components.
   - Each card displays:
     - Airline Logo/Name, Flight Number, Departure/Arrival Times, Duration.
     - **Base Price** (e.g., "₹6,000 via Google Flights/Ixigo").
     - **Effective Price** (e.g., "₹5,200 with HDFC Credit Card").
     - A badge highlighting the applied offer (e.g., "🔥 Save ₹800 with HDFC").

3. **Filters Sidebar (Left Panel)**:
   - Filter by Airlines (IndiGo, Air India, Vistara, etc.).
   - Filter by Departure Time (Morning, Afternoon, Evening, Night).
   - **Bank/Card Selector**: Checkboxes allowing users to filter "Show offers only for cards I own" (e.g., HDFC, SBI, Axis, CRED).

4. **Price Trend Chart (Optional/Future)**:
   - A small visual indicator (Line chart) showing if the price is dropping or rising compared to historical data stored in SQLite.

## 3. Implementation Steps
1. **Update UI Framework**: Ensure we have standard UI components like Card, Badge, Button, Select, Skeleton (loading states).
2. **Build Search Form**: A robust form handling `origin`, `destination`, and `date`.
3. **Build Flight Result Card**: Display the breakdown of `Base Fare + Convenience Fee - Discount = Effective Price`.
4. **Integrate Server Action**: Call `getAndTrackFlights` and handle loading/error states gracefully.
