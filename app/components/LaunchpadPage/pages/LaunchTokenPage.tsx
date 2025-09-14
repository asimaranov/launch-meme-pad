"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload,
  ArrowLeft,
  Plus,
  X,
  AlertCircle,
  CheckCircle,
  Copy,
} from "lucide-react";
import { api } from "../../../lib/api";
import { CreateTokenDraftDto, GenerateTokenTxDto } from "../../../types/api";
import { useSolana } from "../../../context/SolanaContext";

interface FormData {
  // Basic info
  image: File | null;
  imagePreview: string | null;
  name: string;
  ticker: string;
  description: string;

  // Socials
  discord: string;
  telegram: string;
  twitter: string;
  website: string;

  // Advanced
  buyAmount: string;
}

interface FormErrors {
  [key: string]: string;
}

interface SuccessState {
  show: boolean;
  tokenName: string;
  transactionId?: string;
  tokenMint?: string;
}

interface LaunchTokenPageProps {
  onBack: () => void;
}

export default function LaunchTokenPage({ onBack }: LaunchTokenPageProps) {
  const { walletPublicKey, walletConnected } = useSolana();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    image: null,
    imagePreview: null,
    name: "",
    ticker: "",
    description: "",
    discord: "",
    telegram: "",
    twitter: "",
    website: "",
    buyAmount: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [successState, setSuccessState] = useState<SuccessState>({
    show: false,
    tokenName: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateFormData = (
    field: keyof FormData,
    value: string | File | null
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({
          ...prev,
          image: "Please select an image file",
        }));
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          image: "File size must be less than 10MB",
        }));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        updateFormData("image", file);
        updateFormData("imagePreview", reader.result as string);
      };
      reader.readAsDataURL(file);
    },
    [errors]
  );

  const removeImage = () => {
    updateFormData("image", null);
    updateFormData("imagePreview", null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};

    switch (step) {
      case 1:
        if (!formData.image) {
          newErrors.image = "Please upload an image";
        }
        if (!formData.name.trim()) {
          newErrors.name = "Token name is required";
        } else if (formData.name.length > 18) {
          newErrors.name = "Token name must be 18 characters or less";
        }
        if (!formData.ticker.trim()) {
          newErrors.ticker = "Ticker is required";
        } else if (formData.ticker.length > 6) {
          newErrors.ticker = "Ticker must be 6 characters or less";
        }
        if (!formData.description.trim()) {
          newErrors.description = "Description is required";
        } else if (formData.description.length > 236) {
          newErrors.description = "Description must be 236 characters or less";
        }
        break;
      case 2:
        // Step 2 (Social Links) is completely optional - no validation needed
        break;
      case 3:
        // Step 3 (Final Review) - no additional validation needed beyond step 1
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    // Check if wallet is connected before proceeding
    if (!walletConnected || !walletPublicKey) {
      setErrors({
        submit: "Please connect your wallet before creating a token",
      });
      return;
    }

    setIsLoading(true);
    try {
      // First upload the image if exists
      let photoUrl: string | undefined;
      if (formData.image) {
        // Create metadata for the image upload
        const imageMetadata = {
          description: `Image for ${formData.name} (${formData.ticker}) token`,
          type: formData.image.type,
          name: formData.name,
          symbol: formData.ticker,
        };
        photoUrl = await api.uploadImageToIPFS(formData.image, imageMetadata);
      }

      // Create token metadata
      const socialLinks = {
        ...(formData.discord && { discord: formData.discord }),
        ...(formData.telegram && { telegram: formData.telegram }),
        ...(formData.twitter && { twitter: formData.twitter }),
        ...(formData.website && { website: formData.website }),
      };

      const metadata = {
        name: formData.name,
        symbol: formData.ticker,
        description: formData.description,
        image: photoUrl,
        ...(formData.website && { external_url: formData.website }),
        attributes: [],
        properties: {
          files: photoUrl ? [{ uri: photoUrl, type: "image" }] : [],
          category: "image",
        },
        ...(Object.keys(socialLinks).length > 0 && { social: socialLinks }),
      };

      const metadataUri = await api.uploadMetadataToIPFS(metadata);

      // Create token draft
      const tokenData: CreateTokenDraftDto = {
        name: formData.name,
        symbol: formData.ticker,
        description: formData.description,
        decimals: 9,
        supply: 1000000000,
        photo: photoUrl,
        metadataUri,
        hardcap: parseFloat(formData.buyAmount) || 100,
        ...(formData.website && { website: formData.website }),
        ...(formData.twitter && { x: formData.twitter }),
        ...(formData.telegram && { telegram: formData.telegram }),
        version: 1,
      };

      // Try to create token draft, but continue even if it fails
      let draftCreated = false;
      try {
        const draftResponse = await api.createTokenDraft(tokenData);
        draftCreated = draftResponse.success;
        if (!draftCreated) {
          console.warn(
            "Token draft creation failed, continuing with transaction generation"
          );
        }
      } catch (draftError) {
        console.warn("Token draft creation failed:", draftError);
        // Continue with transaction generation even if draft fails
      }

      // Generate the token transaction regardless of draft creation result
      const generateTxData: GenerateTokenTxDto = {
        tokenName: formData.name,
        tokenSymbol: formData.ticker,
        metadataUri,
        userPubkey: walletPublicKey.toString(),
        firstBuyAmount: formData.buyAmount
          ? parseFloat(formData.buyAmount) * 1_000_000_000
          : 100_000_000, // Convert SOL to lamports
      };

      const txResponse = await api.generateTokenTransaction(generateTxData);

      if (txResponse.success) {
        // Success! Show success state with transaction details
        setSuccessState({
          show: true,
          tokenName: formData.name,
          transactionId:
            txResponse.signedTransactionBase64.substring(0, 20) + "...",
          tokenMint: txResponse.tokenMint,
        });
      } else {
        throw new Error("Failed to generate token transaction");
      }
    } catch (error) {
      console.error("Error creating token:", error);

      // Provide more specific error messages based on the error
      let errorMessage = "Failed to create token";

      if (error instanceof Error) {
        if (error.message.includes("upload")) {
          errorMessage =
            "Failed to upload image or metadata. Please try again.";
        } else if (
          error.message.includes("generate") ||
          error.message.includes("transaction")
        ) {
          errorMessage =
            "Failed to generate token transaction. Please contact support.";
        } else if (
          error.message.includes("wallet") ||
          error.message.includes("connect")
        ) {
          errorMessage =
            "Wallet connection issue. Please ensure your wallet is connected and try again.";
        } else {
          errorMessage = error.message;
        }
      }

      setErrors({
        submit: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add a toast notification here
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const renderSuccessScreen = () => (
    <div className="space-y-6 text-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white">
          Token Created Successfully!
        </h1>
        <p className="text-gray-400">
          Your token "{successState.tokenName}" has been created and the
          transaction has been prepared.
        </p>
      </div>

      <div className="space-y-4">
        {successState.tokenMint && (
          <div className="bg-[#1C1C1D] rounded-xl p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Token Mint:</span>
              <button
                onClick={() => copyToClipboard(successState.tokenMint!)}
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
              >
                <span className="font-mono text-sm">
                  {successState.tokenMint.substring(0, 20)}...
                </span>
                <Copy size={16} />
              </button>
            </div>
          </div>
        )}

        {successState.transactionId && (
          <div className="bg-[#1C1C1D] rounded-xl p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Transaction:</span>
              <span className="font-mono text-sm text-white">
                {successState.transactionId}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <button
          onClick={onBack}
          className="w-full bg-[#C0FB5E] text-black py-4 px-6 rounded-xl font-medium hover:bg-[#A8E052] transition-colors"
        >
          Continue to Dashboard
        </button>

        <button
          onClick={() => {
            setSuccessState({ show: false, tokenName: "" });
            setCurrentStep(1);
            setFormData({
              image: null,
              imagePreview: null,
              name: "",
              ticker: "",
              description: "",
              discord: "",
              telegram: "",
              twitter: "",
              website: "",
              buyAmount: "",
            });
            setErrors({});
          }}
          className="w-full bg-gray-700 text-white py-4 px-6 rounded-xl font-medium hover:bg-gray-600 transition-colors"
        >
          Create Another Token
        </button>
      </div>
    </div>
  );

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-2">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border-2 ${
                step === currentStep
                  ? "bg-[#C0FB5E] text-black border-[#98B24F]"
                  : step < currentStep
                    ? "bg-[#98B24F] text-white border-[#98B24F]"
                    : "bg-transparent text-gray-400 border-gray-600"
              }`}
            >
              {step}
            </div>
            {step < 3 && (
              <div className="w-16 h-1 mx-2 bg-gray-700 rounded">
                <div
                  className={`h-full rounded transition-all duration-300 ${
                    step < currentStep
                      ? "bg-[#98B24F] w-full"
                      : "bg-transparent w-0"
                  }`}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Set your token's</h1>
        <p className="text-gray-400">basic information</p>
      </div>

      {/* Image Upload */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-white font-medium">Image</span>
          {formData.imagePreview && (
            <button
              onClick={removeImage}
              className="text-red-400 hover:text-red-300"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {formData.imagePreview ? (
            <img
              src={formData.imagePreview}
              alt="Token"
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-gray-400" />
            </div>
          )}

          <div className="flex-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-400 hover:text-blue-300 text-lg"
            >
              📷 Upload any image
            </button>
            <p className="text-gray-500 text-sm mt-1">10 MB max</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        </div>
        {errors.image && (
          <p className="text-red-400 text-sm flex items-center gap-1">
            <AlertCircle size={16} />
            {errors.image}
          </p>
        )}
      </div>

      {/* Name */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-white font-medium">Name</label>
          <span className="text-gray-400 text-sm">
            {formData.name.length}/18
          </span>
        </div>
        <div className="bg-[#1C1C1D] rounded-xl p-4 border border-gray-700">
          <input
            type="text"
            value={formData.name}
            onChange={(e) => updateFormData("name", e.target.value)}
            placeholder="Enter token name"
            className="w-full bg-transparent text-white placeholder-gray-500 outline-none"
            maxLength={18}
          />
        </div>
        {errors.name && (
          <p className="text-red-400 text-sm flex items-center gap-1">
            <AlertCircle size={16} />
            {errors.name}
          </p>
        )}
      </div>

      {/* Ticker */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-white font-medium">Ticker</label>
          <span className="text-gray-400 text-sm">
            {formData.ticker.length}/6
          </span>
        </div>
        <div className="bg-[#1C1C1D] rounded-xl p-4 border border-gray-700">
          <input
            type="text"
            value={formData.ticker}
            onChange={(e) =>
              updateFormData("ticker", e.target.value.toUpperCase())
            }
            placeholder="Enter ticker symbol"
            className="w-full bg-transparent text-white placeholder-gray-500 outline-none"
            maxLength={6}
          />
        </div>
        {errors.ticker && (
          <p className="text-red-400 text-sm flex items-center gap-1">
            <AlertCircle size={16} />
            {errors.ticker}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-white font-medium">Description</label>
          <span className="text-gray-400 text-sm">
            {formData.description.length}/236
          </span>
        </div>
        <div className="bg-[#1C1C1D] rounded-xl p-4 border border-gray-700">
          <textarea
            value={formData.description}
            onChange={(e) => updateFormData("description", e.target.value)}
            placeholder="Describe your token"
            className="w-full bg-transparent text-white placeholder-gray-500 outline-none resize-none h-24"
            maxLength={236}
          />
        </div>
        {errors.description && (
          <p className="text-red-400 text-sm flex items-center gap-1">
            <AlertCircle size={16} />
            {errors.description}
          </p>
        )}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Social Links</h1>
        <p className="text-gray-400">
          Add your community links (completely optional - you can skip this
          step)
        </p>
      </div>

      {/* Discord */}
      <div className="space-y-2">
        <label className="text-white font-medium">Discord</label>
        <div className="bg-[#1C1C1D] rounded-xl p-4 border border-gray-700">
          <input
            type="url"
            value={formData.discord}
            onChange={(e) => updateFormData("discord", e.target.value)}
            placeholder="https://discord.gg/..."
            className="w-full bg-transparent text-white placeholder-gray-500 outline-none"
          />
        </div>
      </div>

      {/* Telegram */}
      <div className="space-y-2">
        <label className="text-white font-medium">Telegram</label>
        <div className="bg-[#1C1C1D] rounded-xl p-4 border border-gray-700">
          <input
            type="url"
            value={formData.telegram}
            onChange={(e) => updateFormData("telegram", e.target.value)}
            placeholder="https://t.me/..."
            className="w-full bg-transparent text-white placeholder-gray-500 outline-none"
          />
        </div>
      </div>

      {/* Twitter */}
      <div className="space-y-2">
        <label className="text-white font-medium">Twitter</label>
        <div className="bg-[#1C1C1D] rounded-xl p-4 border border-gray-700">
          <input
            type="text"
            value={formData.twitter}
            onChange={(e) => updateFormData("twitter", e.target.value)}
            placeholder="@username or https://x.com/..."
            className="w-full bg-transparent text-white placeholder-gray-500 outline-none"
          />
        </div>
      </div>

      {/* Website */}
      <div className="space-y-2">
        <label className="text-white font-medium">Website</label>
        <div className="bg-[#1C1C1D] rounded-xl p-4 border border-gray-700">
          <input
            type="url"
            value={formData.website}
            onChange={(e) => updateFormData("website", e.target.value)}
            placeholder="https://your-website.com"
            className="w-full bg-transparent text-white placeholder-gray-500 outline-none"
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Final Step</h1>
        <p className="text-gray-400">Review and launch your token</p>
      </div>

      {/* Token Preview */}
      <div className="bg-[#1C1C1D] rounded-xl p-6 border border-gray-700">
        <div className="flex items-center space-x-4 mb-4">
          {formData.imagePreview ? (
            <img
              src={formData.imagePreview}
              alt="Token"
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 bg-gray-700 rounded-full" />
          )}
          <div>
            <h3 className="text-white font-bold text-lg">
              {formData.name || "Token Name"}
            </h3>
            <p className="text-gray-400">{formData.ticker || "TICKER"}</p>
          </div>
        </div>
        <p className="text-gray-300 text-sm">
          {formData.description || "Token description"}
        </p>
      </div>

      {/* Advanced Options */}
      <div className="space-y-4">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center justify-between w-full text-white font-medium"
        >
          <span>Advanced Options</span>
          <Plus
            className={`w-5 h-5 transition-transform ${showAdvanced ? "rotate-45" : ""}`}
          />
        </button>

        {showAdvanced && (
          <div className="space-y-4 pl-4 border-l-2 border-gray-700">
            <div className="space-y-2">
              <label className="text-white font-medium">
                Initial Buy Amount (SOL)
              </label>
              <div className="bg-[#1C1C1D] rounded-xl p-4 border border-gray-700">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.buyAmount}
                  onChange={(e) => updateFormData("buyAmount", e.target.value)}
                  placeholder="0.0"
                  className="w-full bg-transparent text-white placeholder-gray-500 outline-none"
                />
              </div>
              <p className="text-gray-500 text-xs">
                Amount of SOL to buy immediately after token creation
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Wallet Connection Warning */}
      {!walletConnected && (
        <div className="bg-yellow-900/20 border border-yellow-500 rounded-xl p-4">
          <p className="text-yellow-400 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            Please connect your wallet before launching a token
          </p>
        </div>
      )}

      {errors.submit && (
        <div className="bg-red-900/20 border border-red-500 rounded-xl p-4">
          <p className="text-red-400 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {errors.submit}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-screen bg-[#020202] text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-[#020202] flex-shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white"
        >
          <ArrowLeft size={20} />
          Back
        </button>
        <h1 className="text-lg font-semibold">Launch Token</h1>
        <div className="w-16" /> {/* Spacer */}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto p-6">
          {successState.show ? (
            renderSuccessScreen()
          ) : (
            <>
              {renderStepIndicator()}

              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}

              {/* Navigation Buttons */}
              <div className="flex gap-4 mt-8">
                {currentStep > 1 && (
                  <button
                    onClick={prevStep}
                    className="flex-1 bg-gray-700 text-white py-4 px-6 rounded-xl font-medium hover:bg-gray-600 transition-colors"
                  >
                    Previous
                  </button>
                )}

                {currentStep < 3 ? (
                  <button
                    onClick={nextStep}
                    className="flex-1 bg-white text-black py-4 px-6 rounded-xl font-medium hover:bg-gray-100 transition-colors"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="flex-1 bg-[#C0FB5E] text-black py-4 px-6 rounded-xl font-medium hover:bg-[#A8E052] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Creating Token..." : "Launch Token"}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
