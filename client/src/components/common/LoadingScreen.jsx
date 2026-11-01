/**
 * @file LoadingScreen.jsx
 * @description Full-screen loading spinner shown during app initialization.
 */

const LoadingScreen = () => (
  <div className="fixed inset-0 flex flex-col items-center justify-center bg-dark-bg dark:bg-dark-bg bg-light-bg z-50">
    <div className="relative">
      {/* Animated logo circle */}
      <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center shadow-blue-lg animate-float">
        <span className="text-white text-3xl font-bold font-display">B</span>
      </div>
      {/* Spinning ring */}
      <div className="absolute -inset-2 rounded-3xl border-2 border-transparent border-t-blue-500 animate-spin"></div>
    </div>
    <div className="mt-6 text-center">
      <p className="text-lg font-semibold text-dark-text dark:text-dark-text text-light-text font-display">
        BIT Hostel Portal
      </p>
      <p className="text-sm text-dark-muted dark:text-dark-muted text-light-muted mt-1">
        Initializing...
      </p>
    </div>
    {/* Progress dots */}
    <div className="flex gap-1.5 mt-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  </div>
);

export default LoadingScreen;
