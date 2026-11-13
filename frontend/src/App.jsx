import { NavLink, Route, Routes } from "react-router-dom";
import NetworkBanner from "./components/NetworkBanner.jsx";
import WalletButton from "./components/WalletButton.jsx";
import { deployment, network } from "./config.js";
import { explorerLink } from "./lib/contracts.js";
import DashboardPage from "./pages/DashboardPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import VerifyPage from "./pages/VerifyPage.jsx";

function ContractLink({ label, address }) {
  const link = explorerLink("address", address);
  return (
    <span>
      {label}: {link ? <a href={link} target="_blank" rel="noreferrer">{address}</a> : address}
    </span>
  );
}

export default function App() {
  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <NavLink to="/" className="brand">
            <img src="/alu-logo.png" alt="African Leadership University" />
            <span>Logo Registry</span>
          </NavLink>
          <nav className="nav">
            <NavLink to="/" end>
              Verify
            </NavLink>
            <NavLink to="/register">Register</NavLink>
            <NavLink to="/dashboard">Shares</NavLink>
          </nav>
          <WalletButton />
        </div>
      </header>
      <NetworkBanner />

      <main className="main">
        <Routes>
          <Route path="/" element={<VerifyPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </main>

      <footer className="footer">
        <span>Contracts on {network.name}</span>
        <ContractLink label="ALUAssetRegistry" address={deployment.ALUAssetRegistry} />
        <ContractLink label="ALULogoToken" address={deployment.ALULogoToken} />
      </footer>
    </div>
  );
}
