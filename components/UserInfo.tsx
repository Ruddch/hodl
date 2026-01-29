"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { ConnectKitButton } from "connectkit";
import { useAuth } from "@/lib/auth-context";
import { useMyProfile } from "@/lib/api";
import { formatBalance } from "@/lib/balance";
import { Avatar } from "./Avatar";

export function UserInfo() {
  const { address, isConnected } = useAccount();
  const { isAuthenticated, isLoading, login, disconnect } = useAuth();
  const { data: profile } = useMyProfile(isAuthenticated);

  // Используем nickname если есть, иначе генерируем короткое имя из адреса
  const displayName = profile?.nickname 
    ? profile.nickname
    : address
    ? `${address.slice(0, 6)}...${address.slice(-2)}`
    : "User";

  return (
    <div className="p-4 pb-6">
      {isConnected && address ? (
        <div className="rounded-[30px] bg-[#efeff0] border border-[rgba(255,255,255,0.09)] backdrop-blur-[150px] p-4">
          {/* User Avatar and Name */}
          <Link href="/profile" className="flex items-center gap-3 mb-4 cursor-pointer hover:opacity-80 transition-opacity min-w-0">
            <Avatar 
              walletAddress={address} 
              size={40} 
              avatarUrl={profile?.avatar_url}
            />
            <span className="font-semibold text-black truncate">{displayName}</span>
          </Link>

          {/* Balance */}
          <div className="mb-3">
            <p className="text-sm text-zinc-400">Balance</p>
            <p className="text-lg font-semibold text-black">
              {formatBalance(profile?.stats?.balances)}
            </p>
          </div>

          {/* My Cards */}
          <Link href="/profile" className="bg-white rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity">
            <span className="text-sm text-black">My cards</span>
            <span className="text-sm font-semibold text-black">
              {profile?.total_cards ?? profile?.cards?.length ?? 0}
            </span>
          </Link>

          {/* Auth button if not authenticated */}
          {!isAuthenticated && !isLoading && (
            <button
              onClick={() => login()}
              className="w-full mt-3 py-2 px-4 text-sm rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Sign In
            </button>
          )}
          
          {isLoading && (
            <div className="mt-3 text-center text-sm text-zinc-400">
              Signing in...
            </div>
          )}

          {/* Disconnect button */}
          <button
            onClick={() => disconnect()}
            className="w-full cursor-pointer mt-3 py-2 px-4 text-sm rounded-xl border border-zinc-300 text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div className="rounded-[30px] bg-[#efeff0] border border-[rgba(255,255,255,0.09)] backdrop-blur-[150px] p-4">
          
          <ConnectKitButton.Custom>
            {({ show }) => {
              return (
                <button
                  onClick={show}
                  className="cursor-pointer w-full py-3 bg-[#2200EF] hover:opacity-90 text-white text-base font-medium rounded-[15px] transition-colors"
                  style={{
                    boxShadow: "0px 4px 12px 0px rgba(74, 106, 255, 0.3), 0px 2px 4px 0px rgba(74, 106, 255, 0.2)"
                  }}
                >
                  Connect Wallet
                </button>
              );
            }}
          </ConnectKitButton.Custom>
        </div>
      )}
    </div>
  );
}
