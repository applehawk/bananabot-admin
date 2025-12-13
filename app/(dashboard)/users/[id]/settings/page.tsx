'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

import { Prisma, ModelTariff } from '@prisma/client';

type UserSettings = Prisma.UserSettingsGetPayload<{
  include: {
    user: {
      select: {
        username: true;
        firstName: true;
        telegramId: true;
        personalMargin: true;
      }
    }
  }
}>;

export default function UserSettingsPage() {
  const params = useParams();
  const userId = params?.id as string;
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [tariffs, setTariffs] = useState<ModelTariff[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    aspectRatio: '1:1',
    numberOfImages: 1,
    safetyLevel: 'BLOCK_MEDIUM_AND_ABOVE',
    language: 'en',
    hdQuality: false,
    autoEnhance: true,
    useNegativePrompt: true,
    notifyOnComplete: true,
    notifyOnBonus: true,
    isSubscriptionRequired: true,
    selectedModelId: 'gemini-2.5-flash-image',
    personalMargin: 0,
    enhancementPrompt: '',
  });

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId]);

  const fetchData = async () => {
    try {
      const [settingsRes, tariffsRes] = await Promise.all([
        fetch(`/admin/api/users/${userId}/settings`),
        fetch('/admin/api/tariffs'),
      ]);

      if (tariffsRes.ok) {
        setTariffs(await tariffsRes.json());
      }

      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setSettings(data);
        setFormData({
          aspectRatio: data.aspectRatio,
          numberOfImages: data.numberOfImages,
          safetyLevel: data.safetyLevel,
          language: data.language,
          hdQuality: data.hdQuality,
          autoEnhance: data.autoEnhance,
          useNegativePrompt: data.useNegativePrompt,
          notifyOnComplete: data.notifyOnComplete,
          notifyOnBonus: data.notifyOnBonus,
          isSubscriptionRequired: data.isSubscriptionRequired ?? true,
          selectedModelId: data.selectedModelId, // Changed from geminiModelId
          personalMargin: data.user.personalMargin || 0,
          enhancementPrompt: data.enhancementPrompt || '',
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch(`/admin/api/users/${userId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      alert('Settings updated successfully');
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-3xl font-bold text-gray-900">Settings Not Found</h1>
          </div>
        </header>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/users" className="text-blue-600 hover:text-blue-800">
              ← Back to Users
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              ⚙️ User Settings: {settings.user.firstName || settings.user.username || String(settings.user.telegramId)}
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Margin */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Financial Settings</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User Margin (0.10 = 10%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.personalMargin}
                  onChange={(e) => setFormData({ ...formData, personalMargin: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Extra margin applied to this specific user's generations.
                </p>
              </div>
            </div>

            {/* Generation Settings */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Generation Settings</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aspect Ratio
                  </label>
                  <select
                    value={formData.aspectRatio}
                    onChange={(e) => setFormData({ ...formData, aspectRatio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="1:1">1:1 (Square)</option>
                    <option value="16:9">16:9 (Landscape)</option>
                    <option value="9:16">9:16 (Portrait)</option>
                    <option value="3:4">3:4</option>
                    <option value="4:3">4:3</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Images
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="4"
                    value={formData.numberOfImages}
                    onChange={(e) => setFormData({ ...formData, numberOfImages: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Safety Level
                  </label>
                  <select
                    value={formData.safetyLevel}
                    onChange={(e) => setFormData({ ...formData, safetyLevel: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="BLOCK_NONE">Block None</option>
                    <option value="BLOCK_ONLY_HIGH">Block Only High</option>
                    <option value="BLOCK_MEDIUM_AND_ABOVE">Block Medium and Above</option>
                    <option value="BLOCK_LOW_AND_ABOVE">Block Low and Above</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Language
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="en">English</option>
                    <option value="ru">Russian</option>
                    <option value="es">Spanish</option>
                    <option value="de">German</option>
                    <option value="fr">French</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gemini Model
                  </label>
                  <select
                    id="selectedModelId"
                    value={formData.selectedModelId}
                    onChange={(e) => setFormData({ ...formData, selectedModelId: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {tariffs.length > 0 ? (
                      tariffs.map((tariff) => (
                        <option key={tariff.id} value={tariff.modelId}>
                          {tariff.name}
                        </option>
                      ))
                    ) : (
                      <option value="gemini-2.5-flash-image">Gemini 2.5 Flash Image (Default)</option>
                    )}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Select the Gemini model to use for image generation for this user
                  </p>
                </div>
              </div>
            </div>

            {/* Quality Settings */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Quality Settings</h2>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.hdQuality}
                    onChange={(e) => setFormData({ ...formData, hdQuality: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">HD Quality</span>
                </label>
              </div>
            </div>

            {/* Prompt Enhancement */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Prompt Enhancement</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.autoEnhance}
                      onChange={(e) => setFormData({ ...formData, autoEnhance: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium">Auto Enhance Prompts</span>
                  </label>

                  {formData.autoEnhance && (
                    <div className="ml-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Enhancement System Prompt
                      </label>
                      <textarea
                        value={formData.enhancementPrompt}
                        onChange={(e) => setFormData({ ...formData, enhancementPrompt: e.target.value })}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                        placeholder="Enter the system prompt used for enhancing user prompts..."
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        This instruction tells the AI how to rewrite and improve the user's prompt.
                      </p>
                    </div>
                  )}
                </div>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.useNegativePrompt}
                    onChange={(e) => setFormData({ ...formData, useNegativePrompt: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">Use Negative Prompts</span>
                </label>
              </div>
            </div>

            {/* Notifications */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Notifications</h2>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.notifyOnComplete}
                    onChange={(e) => setFormData({ ...formData, notifyOnComplete: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Notify on Generation Complete</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.notifyOnBonus}
                    onChange={(e) => setFormData({ ...formData, notifyOnBonus: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Notify on Bonus</span>
                </label>
              </div>
            </div>

            {/* Access Settings */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Access Control</h2>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isSubscriptionRequired}
                    onChange={(e) => setFormData({ ...formData, isSubscriptionRequired: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Require Channel Subscription</span>
                </label>
                <p className="text-xs text-gray-500 ml-6">
                  If unchecked, this specific user will NOT be required to subscribe, even if globally enabled.
                </p>
              </div>
            </div>

            {/* Metadata */}
            <div className="border-t pt-4">
              <div className="text-sm text-gray-500">
                <p>Created: {new Date(settings.createdAt).toLocaleString()}</p>
                <p>Updated: {new Date(settings.updatedAt).toLocaleString()}</p>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-4">
              <Link
                href="/users"
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
