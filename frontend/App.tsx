import { ClerkProvider, SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { clerkPublishableKey } from "./config";
import { ChatApp } from "./components/ChatApp";

const queryClient = new QueryClient();

export default function App() {
  if (!clerkPublishableKey) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center p-8 max-w-md">
          <h1 className="text-2xl font-bold mb-4">Configuration Required</h1>
          <p className="text-muted-foreground">
            Please set your Clerk publishable key in the Infrastructure tab to enable authentication.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <QueryClientProvider client={queryClient}>
        <SignedOut>
          <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="text-center p-8">
              <h1 className="text-4xl font-bold mb-4">WhatsApp Clone</h1>
              <p className="text-muted-foreground mb-8">Sign in to start chatting</p>
              <SignInButton mode="modal">
                <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
                  Sign In
                </button>
              </SignInButton>
            </div>
          </div>
        </SignedOut>
        <SignedIn>
          <ChatApp />
        </SignedIn>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
