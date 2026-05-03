import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F2F2F2]" dir="rtl">
          <div className="text-center max-w-md px-4">
            <h1 className="text-2xl font-bold text-[#1A1A1A] mb-3">משהו השתבש</h1>
            <p className="text-[#555E6D] mb-6">אירעה שגיאה בלתי צפויה. אנא רענן את הדף.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#1D4E8F] text-white px-6 py-2 rounded-lg hover:bg-[#2560B0] transition-colors"
            >
              רענן דף
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
