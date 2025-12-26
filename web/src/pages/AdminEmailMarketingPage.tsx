import React, { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import ConfirmationModal from "../components/universal/ConfirmationModal";
import * as newsletterApi from "../services/newsletter.api";
import type {
  SendNewsletterRequest,
  NewsletterSubscriber,
  SystemUser,
} from "../services/newsletter.api";
import {
  MdEmail,
  MdSend,
  MdCheckCircle,
  MdError,
  MdPeople,
  MdClose,
  MdFormatBold,
  MdFormatItalic,
  MdFormatUnderlined,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdLink,
  MdDelete,
} from "react-icons/md";
import {
  FaRocket,
  FaNewspaper,
  FaBell,
  FaClipboardList,
} from "react-icons/fa";
import { BiLoaderAlt } from "react-icons/bi";
import { HiSparkles } from "react-icons/hi";
import useDocumentTitle from "../hooks/useDocumentTitle";

const TEMPLATE_TYPES = [
  {
    value: "changelog" as const,
    label: "Changelog",
    icon: FaClipboardList,
    color: "bg-emerald-500",
    hoverColor: "hover:bg-emerald-600",
    borderColor: "border-emerald-500",
    textColor: "text-emerald-500",
    description: "Product updates & improvements",
  },
  {
    value: "release" as const,
    label: "Release",
    icon: FaRocket,
    color: "bg-blue-500",
    hoverColor: "hover:bg-blue-600",
    borderColor: "border-blue-500",
    textColor: "text-blue-500",
    description: "New versions & features",
  },
  {
    value: "news" as const,
    label: "News",
    icon: FaNewspaper,
    color: "bg-purple-500",
    hoverColor: "hover:bg-purple-600",
    borderColor: "border-purple-500",
    textColor: "text-purple-500",
    description: "Company announcements",
  },
  {
    value: "update" as const,
    label: "Update",
    icon: FaBell,
    color: "bg-amber-500",
    hoverColor: "hover:bg-amber-600",
    borderColor: "border-amber-500",
    textColor: "text-amber-500",
    description: "General notifications",
  },
  {
    value: "marketing" as const,
    label: "Marketing",
    icon: HiSparkles,
    color: "bg-gradient-to-r from-pink-500 to-rose-500",
    hoverColor: "hover:from-pink-600 hover:to-rose-600",
    borderColor: "border-pink-500",
    textColor: "text-pink-500",
    description: "Promotional & registration invite",
  },
];

const EXAMPLE_CONTENT: Record<string, string> = {
  changelog: `<!-- ZYGOTRIX CHANGELOG TEMPLATE -->
<!-- Perfect for product updates, improvements, and bug fixes -->

<!-- HERO SECTION -->
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="background: linear-gradient(135deg, #064e3b 0%, #10b981 50%, #047857 100%); padding: 50px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center">
            <!-- Main Headline -->
            <h1 style="color: #ffffff; font-size: 38px; font-weight: 800; line-height: 1.2; margin: 0 0 15px 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
              What's New This Week
            </h1>
            
            <!-- Version & Date -->
            <p style="color: #a7f3d0; font-size: 16px; margin: 0;">
              Version 2.1.0 • December 2024
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- CHANGES SECTION -->
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="background: #ffffff; padding: 50px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <!-- NEW FEATURES -->
            <div style="margin-bottom: 35px;">
              <div style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); padding: 6px 14px; border-radius: 6px; margin-bottom: 20px;">
                <span style="color: white; font-size: 13px; font-weight: 700;">✨ NEW FEATURES</span>
              </div>
              
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="30" valign="top">
                          <span style="color: #10b981; font-size: 18px;">●</span>
                        </td>
                        <td valign="top">
                          <p style="color: #0f172a; font-size: 16px; font-weight: 600; margin: 0 0 4px 0;">Advanced Genetic Analysis Tools</p>
                          <p style="color: #64748b; font-size: 14px; margin: 0;">New suite of analysis tools for deeper genetic insights and visualization.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="30" valign="top">
                          <span style="color: #10b981; font-size: 18px;">●</span>
                        </td>
                        <td valign="top">
                          <p style="color: #0f172a; font-size: 16px; font-weight: 600; margin: 0 0 4px 0;">DNA Sequence Export</p>
                          <p style="color: #64748b; font-size: 14px; margin: 0;">Export your generated DNA sequences in FASTA and GenBank formats.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </div>
            
            <!-- IMPROVEMENTS -->
            <div style="margin-bottom: 35px;">
              <div style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 6px 14px; border-radius: 6px; margin-bottom: 20px;">
                <span style="color: white; font-size: 13px; font-weight: 700;">⚡ IMPROVEMENTS</span>
              </div>
              
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="30" valign="top">
                          <span style="color: #3b82f6; font-size: 18px;">●</span>
                        </td>
                        <td valign="top">
                          <p style="color: #0f172a; font-size: 16px; font-weight: 600; margin: 0 0 4px 0;">3x Faster Simulation Processing</p>
                          <p style="color: #64748b; font-size: 14px; margin: 0;">Optimized engine now processes genetic crosses significantly faster.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="30" valign="top">
                          <span style="color: #3b82f6; font-size: 18px;">●</span>
                        </td>
                        <td valign="top">
                          <p style="color: #0f172a; font-size: 16px; font-weight: 600; margin: 0 0 4px 0;">Enhanced UI/UX</p>
                          <p style="color: #64748b; font-size: 14px; margin: 0;">Refined interface with better accessibility and mobile responsiveness.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </div>
            
            <!-- BUG FIXES -->
            <div>
              <div style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); padding: 6px 14px; border-radius: 6px; margin-bottom: 20px;">
                <span style="color: white; font-size: 13px; font-weight: 700;">🐛 BUG FIXES</span>
              </div>
              
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="30" valign="top">
                          <span style="color: #f59e0b; font-size: 18px;">●</span>
                        </td>
                        <td valign="top">
                          <p style="color: #0f172a; font-size: 16px; font-weight: 600; margin: 0 0 4px 0;">Trait Calculator Issue Resolved</p>
                          <p style="color: #64748b; font-size: 14px; margin: 0;">Fixed calculation errors for polygenic trait scoring.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="30" valign="top">
                          <span style="color: #f59e0b; font-size: 18px;">●</span>
                        </td>
                        <td valign="top">
                          <p style="color: #0f172a; font-size: 16px; font-weight: 600; margin: 0 0 4px 0;">Session Timeout Fix</p>
                          <p style="color: #64748b; font-size: 14px; margin: 0;">Users no longer experience unexpected logouts during long sessions.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- CTA SECTION -->
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 45px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center">
            <h2 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0 0 15px 0;">
              Ready to Try These Updates?
            </h2>
            <p style="color: #d1fae5; font-size: 16px; margin: 0 0 25px 0;">
              All changes are live now — no action needed on your part!
            </p>
            
            <a href="https://zygotrix.com/studio" style="display: inline-block; background: #ffffff; color: #059669; padding: 16px 40px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 16px; box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);">
              🧬 Open Zygotrix Studio
            </a>
            
            <p style="color: #a7f3d0; font-size: 13px; margin-top: 20px;">
              <a href="https://zygotrix.com/changelog" style="color: #a7f3d0; text-decoration: underline;">View full changelog →</a>
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`,
  release: `<!-- ZYGOTRIX RELEASE ANNOUNCEMENT TEMPLATE -->
<!-- Customize the version number, features, and details below -->

<!-- HERO SECTION -->
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #1e40af 100%); padding: 50px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center">
            <!-- Version Number -->
            <h1 style="color: #ffffff; font-size: 52px; font-weight: 800; line-height: 1.1; margin: 0 0 15px 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
              Version 2.0
            </h1>
            
            <!-- Release Title -->
            <p style="color: #bfdbfe; font-size: 22px; font-weight: 600; margin: 0 0 15px 0;">
              The Future of Genetics Simulation
            </p>
            
            <!-- Release Date -->
            <p style="color: #93c5fd; font-size: 14px; margin: 0;">
              Released December 2024
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- KEY HIGHLIGHTS BAR -->
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="background: #0f172a; padding: 25px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding: 0 30px; text-align: center;">
                  <p style="color: #3b82f6; font-size: 32px; font-weight: 800; margin: 0;">50+</p>
                  <p style="color: #94a3b8; font-size: 12px; margin: 5px 0 0 0;">New Features</p>
                </td>
                <td style="padding: 0 30px; text-align: center; border-left: 1px solid #334155; border-right: 1px solid #334155;">
                  <p style="color: #3b82f6; font-size: 32px; font-weight: 800; margin: 0;">3x</p>
                  <p style="color: #94a3b8; font-size: 12px; margin: 5px 0 0 0;">Faster Performance</p>
                </td>
                <td style="padding: 0 30px; text-align: center;">
                  <p style="color: #3b82f6; font-size: 32px; font-weight: 800; margin: 0;">100%</p>
                  <p style="color: #94a3b8; font-size: 12px; margin: 5px 0 0 0;">Backward Compatible</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- MAIN FEATURES SECTION -->
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="background: #ffffff; padding: 50px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <h2 style="color: #0f172a; font-size: 28px; font-weight: 700; text-align: center; margin: 0 0 10px 0;">
              What's New in This Release
            </h2>
            <p style="color: #64748b; font-size: 16px; text-align: center; margin: 0 0 40px 0;">
              Major improvements across the platform
            </p>
          </td>
        </tr>
        
        <!-- Feature 1 -->
        <tr>
          <td style="padding-bottom: 25px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="60" valign="top">
                  <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); width: 50px; height: 50px; border-radius: 12px; text-align: center; line-height: 50px;">
                    <span style="font-size: 24px;">🧬</span>
                  </div>
                </td>
                <td valign="top" style="padding-left: 15px;">
                  <h3 style="color: #0f172a; font-size: 18px; font-weight: 700; margin: 0 0 8px 0;">Enhanced Polygenic Score Engine</h3>
                  <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin: 0;">Completely redesigned scoring algorithm with 10x improved accuracy for complex trait predictions.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        
        <!-- Feature 2 -->
        <tr>
          <td style="padding-bottom: 25px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="60" valign="top">
                  <div style="background: linear-gradient(135deg, #10b981, #059669); width: 50px; height: 50px; border-radius: 12px; text-align: center; line-height: 50px;">
                    <span style="font-size: 24px;">📊</span>
                  </div>
                </td>
                <td valign="top" style="padding-left: 15px;">
                  <h3 style="color: #0f172a; font-size: 18px; font-weight: 700; margin: 0 0 8px 0;">Advanced Visualization Suite</h3>
                  <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin: 0;">Beautiful new charts, interactive Punnett squares, and export capabilities for presentations.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        
        <!-- Feature 3 -->
        <tr>
          <td style="padding-bottom: 25px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="60" valign="top">
                  <div style="background: linear-gradient(135deg, #8b5cf6, #6d28d9); width: 50px; height: 50px; border-radius: 12px; text-align: center; line-height: 50px;">
                    <span style="font-size: 24px;">🤖</span>
                  </div>
                </td>
                <td valign="top" style="padding-left: 15px;">
                  <h3 style="color: #0f172a; font-size: 18px; font-weight: 700; margin: 0 0 8px 0;">Smarter AI Assistant (Zigi 2.0)</h3>
                  <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin: 0;">Now powered by advanced language models with deeper genetics knowledge and faster responses.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        
        <!-- Feature 4 -->
        <tr>
          <td>
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="60" valign="top">
                  <div style="background: linear-gradient(135deg, #f59e0b, #d97706); width: 50px; height: 50px; border-radius: 12px; text-align: center; line-height: 50px;">
                    <span style="font-size: 24px;">⚡</span>
                  </div>
                </td>
                <td valign="top" style="padding-left: 15px;">
                  <h3 style="color: #0f172a; font-size: 18px; font-weight: 700; margin: 0 0 8px 0;">Blazing Fast Simulations</h3>
                  <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin: 0;">Optimized C++ engine now processes up to 10 million base pairs in seconds.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- CTA SECTION -->
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 50px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center">
            <h2 style="color: #ffffff; font-size: 28px; font-weight: 800; margin: 0 0 15px 0;">
              Ready to Experience Version 2.0?
            </h2>
            <p style="color: #bfdbfe; font-size: 16px; margin: 0 0 25px 0;">
              Update now to access all the new features!
            </p>
            
            <a href="https://zygotrix.com/studio" style="display: inline-block; background: #ffffff; color: #1d4ed8; padding: 16px 40px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 16px; box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);">
              🚀 Try Version 2.0 Now
            </a>
            
            <p style="color: #93c5fd; font-size: 13px; margin-top: 20px;">
              <a href="https://zygotrix.com/changelog" style="color: #93c5fd; text-decoration: underline;">View full changelog →</a>
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`,
  news: `<!-- ZYGOTRIX NEWS ANNOUNCEMENT TEMPLATE -->
<!-- Perfect for company announcements, partnerships, and exciting news -->

<!-- HERO SECTION -->
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="background: linear-gradient(135deg, #581c87 0%, #7c3aed 50%, #4c1d95 100%); padding: 50px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center">
            <!-- Main Headline -->
            <h1 style="color: #ffffff; font-size: 38px; font-weight: 800; line-height: 1.2; margin: 0 0 20px 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
              Exciting News from Zygotrix!
            </h1>
            
            <!-- Subheadline -->
            <p style="color: #e9d5ff; font-size: 18px; line-height: 1.6; margin: 0; max-width: 500px;">
              We're thrilled to share some important updates with our amazing community.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- MAIN CONTENT SECTION -->
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="background: #ffffff; padding: 50px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <!-- Featured News Block -->
            <div style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); padding: 30px; border-radius: 16px; border-left: 4px solid #7c3aed; margin-bottom: 30px;">
              <h2 style="color: #581c87; font-size: 24px; font-weight: 700; margin: 0 0 15px 0;">
                🎉 [Your Headline Here]
              </h2>
              <p style="color: #6b7280; font-size: 16px; line-height: 1.7; margin: 0;">
                Share your exciting news here. This could be a partnership announcement, milestone achievement, award recognition, or any other important update you want to share with your community.
              </p>
            </div>
            
            <!-- Additional Details -->
            <h3 style="color: #0f172a; font-size: 20px; font-weight: 700; margin: 0 0 15px 0;">
              What This Means for You
            </h3>
            <p style="color: #64748b; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
              Explain how this news impacts your users. What benefits will they see? What changes should they expect? Keep your community informed and engaged.
            </p>
            
            <!-- Key Points -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 30px;">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
                  <span style="color: #7c3aed; font-size: 18px; margin-right: 12px;">✦</span>
                  <span style="color: #334155; font-size: 16px;"><strong>Key Point 1</strong> — Brief description of the first important detail</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
                  <span style="color: #7c3aed; font-size: 18px; margin-right: 12px;">✦</span>
                  <span style="color: #334155; font-size: 16px;"><strong>Key Point 2</strong> — Brief description of the second important detail</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0;">
                  <span style="color: #7c3aed; font-size: 18px; margin-right: 12px;">✦</span>
                  <span style="color: #334155; font-size: 16px;"><strong>Key Point 3</strong> — Brief description of the third important detail</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- CTA SECTION -->
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); padding: 45px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center">
            <h2 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0 0 15px 0;">
              Want to Learn More?
            </h2>
            <p style="color: #e9d5ff; font-size: 16px; margin: 0 0 25px 0;">
              Read the full announcement on our blog
            </p>
            
            <a href="https://zygotrix.com/blog" style="display: inline-block; background: #ffffff; color: #5b21b6; padding: 16px 40px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 16px; box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);">
              📖 Read Full Story
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`,
  update: `<!-- ZYGOTRIX UPDATE NOTIFICATION TEMPLATE -->
<!-- Perfect for system updates, maintenance notices, and general notifications -->

<!-- HERO SECTION -->
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="background: linear-gradient(135deg, #92400e 0%, #f59e0b 50%, #b45309 100%); padding: 50px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center">
            <!-- Main Headline -->
            <h1 style="color: #ffffff; font-size: 36px; font-weight: 800; line-height: 1.2; margin: 0 0 20px 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
              Important Update
            </h1>
            
            <!-- Subheadline -->
            <p style="color: #fef3c7; font-size: 18px; line-height: 1.6; margin: 0; max-width: 500px;">
              We wanted to keep you informed about the latest developments at Zygotrix.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- MAIN CONTENT SECTION -->
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="background: #ffffff; padding: 50px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <!-- Update Notice Box -->
            <div style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); padding: 25px; border-radius: 16px; border-left: 4px solid #f59e0b; margin-bottom: 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="50" valign="top">
                    <div style="background: #f59e0b; width: 40px; height: 40px; border-radius: 10px; text-align: center; line-height: 40px;">
                      <span style="font-size: 20px;">📢</span>
                    </div>
                  </td>
                  <td valign="top" style="padding-left: 15px;">
                    <h3 style="color: #92400e; font-size: 18px; font-weight: 700; margin: 0 0 8px 0;">What You Need to Know</h3>
                    <p style="color: #78716c; font-size: 15px; line-height: 1.6; margin: 0;">
                      Briefly describe the update here. Keep it clear and concise so users understand the key information at a glance.
                    </p>
                  </td>
                </tr>
              </table>
            </div>
            
            <!-- Details Section -->
            <h3 style="color: #0f172a; font-size: 20px; font-weight: 700; margin: 0 0 20px 0;">
              Update Details
            </h3>
            
            <!-- Detail Items -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 30px;">
              <tr>
                <td style="padding: 15px; background: #f8fafc; border-radius: 10px; margin-bottom: 10px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td width="40" valign="top">
                        <span style="font-size: 24px;">📅</span>
                      </td>
                      <td valign="top" style="padding-left: 10px;">
                        <p style="color: #64748b; font-size: 12px; text-transform: uppercase; margin: 0 0 5px 0;">When</p>
                        <p style="color: #0f172a; font-size: 16px; font-weight: 600; margin: 0;">December 20, 2024 at 2:00 PM UTC</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr><td style="height: 10px;"></td></tr>
              <tr>
                <td style="padding: 15px; background: #f8fafc; border-radius: 10px; margin-bottom: 10px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td width="40" valign="top">
                        <span style="font-size: 24px;">⏱️</span>
                      </td>
                      <td valign="top" style="padding-left: 10px;">
                        <p style="color: #64748b; font-size: 12px; text-transform: uppercase; margin: 0 0 5px 0;">Duration</p>
                        <p style="color: #0f172a; font-size: 16px; font-weight: 600; margin: 0;">Approximately 30 minutes</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr><td style="height: 10px;"></td></tr>
              <tr>
                <td style="padding: 15px; background: #f8fafc; border-radius: 10px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td width="40" valign="top">
                        <span style="font-size: 24px;">💡</span>
                      </td>
                      <td valign="top" style="padding-left: 10px;">
                        <p style="color: #64748b; font-size: 12px; text-transform: uppercase; margin: 0 0 5px 0;">Impact</p>
                        <p style="color: #0f172a; font-size: 16px; font-weight: 600; margin: 0;">No action required from your side</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            
            <!-- Additional Info -->
            <p style="color: #64748b; font-size: 15px; line-height: 1.7; margin: 0;">
              Thank you for being part of our community! If you have any questions, don't hesitate to reach out to our support team.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- FOOTER CTA -->
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="background: #0f172a; padding: 40px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center">
            <p style="color: #94a3b8; font-size: 14px; margin: 0 0 20px 0;">
              Need help? Our support team is here for you.
            </p>
            <a href="https://zygotrix.com/support" style="display: inline-block; background: #f59e0b; color: #0f172a; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px;">
              📧 Contact Support
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`,
  marketing: `<!-- ZYGOTRIX PREMIUM MARKETING EMAIL TEMPLATE -->
<!-- Edit the content below while keeping the structure intact -->

<!-- HERO SECTION -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0; padding: 0;">
  <tr>
    <td align="center" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%); padding: 60px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center">
            <!-- Main Headline -->
            <h1 style="color: #ffffff; font-size: 42px; font-weight: 800; line-height: 1.2; margin: 0 0 20px 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
              Discover the <span style="background: linear-gradient(90deg, #10b981, #34d399); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Future</span> of<br/>Genetics Education
            </h1>
            
            <!-- Subheadline -->
            <p style="color: #94a3b8; font-size: 18px; line-height: 1.6; margin: 0 0 40px 0; max-width: 480px;">
              Join thousands of students and researchers who are transforming their understanding of DNA with our interactive platform.
            </p>
            
            <!-- CTA Button -->
            <a href="https://zygotrix.com/signup" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 18px 48px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; box-shadow: 0 10px 40px rgba(16, 185, 129, 0.4); transition: all 0.3s;">
              🚀 Start Free Today
            </a>
            
            <p style="color: #64748b; font-size: 13px; margin-top: 20px;">No credit card required • Setup in 2 minutes</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- SOCIAL PROOF BAR -->
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="background: #f8fafc; padding: 30px 20px; border-bottom: 1px solid #e2e8f0;">
      <table width="600" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center">
            <p style="color: #64748b; font-size: 14px; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 1px;">Trusted by learners worldwide</p>
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding: 0 25px; text-align: center;">
                  <p style="color: #0f172a; font-size: 28px; font-weight: 800; margin: 0;">10K+</p>
                  <p style="color: #64748b; font-size: 12px; margin: 5px 0 0 0;">Active Users</p>
                </td>
                <td style="padding: 0 25px; text-align: center; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
                  <p style="color: #0f172a; font-size: 28px; font-weight: 800; margin: 0;">500K+</p>
                  <p style="color: #64748b; font-size: 12px; margin: 5px 0 0 0;">Simulations Run</p>
                </td>
                <td style="padding: 0 25px; text-align: center;">
                  <p style="color: #0f172a; font-size: 28px; font-weight: 800; margin: 0;">4.9★</p>
                  <p style="color: #64748b; font-size: 12px; margin: 5px 0 0 0;">User Rating</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- FEATURES SECTION -->
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="background: #ffffff; padding: 60px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <h2 style="color: #0f172a; font-size: 32px; font-weight: 700; text-align: center; margin: 0 0 15px 0;">
              Everything You Need to <span style="color: #10b981;">Master Genetics</span>
            </h2>
            <p style="color: #64748b; font-size: 16px; text-align: center; margin: 0 0 40px 0;">
              Powerful tools designed for modern learning
            </p>
          </td>
        </tr>
        
        <!-- Feature Cards Row 1 -->
        <tr>
          <td>
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <!-- Feature 1 -->
                <td width="48%" style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 25px; border-radius: 16px; vertical-align: top;">
                  <div style="background: #10b981; width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 15px;">
                    <span style="font-size: 24px;">🔬</span>
                  </div>
                  <h3 style="color: #0f172a; font-size: 18px; font-weight: 700; margin: 0 0 10px 0;">Interactive Simulations</h3>
                  <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin: 0;">Run genetic crosses in real-time with our powerful simulation engine.</p>
                </td>
                <td width="4%"></td>
                <!-- Feature 2 -->
                <td width="48%" style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); padding: 25px; border-radius: 16px; vertical-align: top;">
                  <div style="background: #3b82f6; width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 15px;">
                    <span style="font-size: 24px;">🤖</span>
                  </div>
                  <h3 style="color: #0f172a; font-size: 18px; font-weight: 700; margin: 0 0 10px 0;">AI Learning Assistant</h3>
                  <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin: 0;">Meet Zigi - your 24/7 AI tutor for genetics questions.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        
        <tr><td style="height: 15px;"></td></tr>
        
        <!-- Feature Cards Row 2 -->
        <tr>
          <td>
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <!-- Feature 3 -->
                <td width="48%" style="background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%); padding: 25px; border-radius: 16px; vertical-align: top;">
                  <div style="background: #eab308; width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 15px;">
                    <span style="font-size: 24px;">📊</span>
                  </div>
                  <h3 style="color: #0f172a; font-size: 18px; font-weight: 700; margin: 0 0 10px 0;">Advanced Analytics</h3>
                  <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin: 0;">Visualize inheritance patterns with beautiful charts and graphs.</p>
                </td>
                <td width="4%"></td>
                <!-- Feature 4 -->
                <td width="48%" style="background: linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%); padding: 25px; border-radius: 16px; vertical-align: top;">
                  <div style="background: #a855f7; width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 15px;">
                    <span style="font-size: 24px;">📚</span>
                  </div>
                  <h3 style="color: #0f172a; font-size: 18px; font-weight: 700; margin: 0 0 10px 0;">Trait Library</h3>
                  <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin: 0;">Explore 100+ genetic traits from eye color to complex conditions.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- TESTIMONIAL SECTION -->
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 60px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center">
            <p style="color: #10b981; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 20px 0;">💬 What Our Users Say</p>
            
            <div style="background: rgba(255,255,255,0.05); padding: 30px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1);">
              <p style="color: #f1f5f9; font-size: 20px; font-style: italic; line-height: 1.6; margin: 0 0 25px 0;">
                "Zygotrix completely transformed how I teach genetics. My students are more engaged than ever, and the AI assistant is like having a teaching aide available 24/7!"
              </p>
              <div>
                <p style="color: #10b981; font-size: 16px; font-weight: 700; margin: 0;">Dr. Sarah Mitchell</p>
                <p style="color: #64748b; font-size: 14px; margin: 5px 0 0 0;">Professor of Genetics, Stanford University</p>
              </div>
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- WHAT YOU GET SECTION -->
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="background: #ffffff; padding: 60px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center">
            <h2 style="color: #0f172a; font-size: 28px; font-weight: 700; margin: 0 0 30px 0;">
              🎁 Join Today and Unlock
            </h2>
            
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="text-align: left;">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
                  <span style="color: #10b981; font-size: 18px; margin-right: 12px;">✓</span>
                  <span style="color: #334155; font-size: 16px;"><strong>Unlimited Simulations</strong> — Run as many genetic crosses as you want</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
                  <span style="color: #10b981; font-size: 18px; margin-right: 12px;">✓</span>
                  <span style="color: #334155; font-size: 16px;"><strong>AI Chatbot Access</strong> — Get instant answers to any genetics question</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
                  <span style="color: #10b981; font-size: 18px; margin-right: 12px;">✓</span>
                  <span style="color: #334155; font-size: 16px;"><strong>Personal Dashboard</strong> — Track your learning progress</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
                  <span style="color: #10b981; font-size: 18px; margin-right: 12px;">✓</span>
                  <span style="color: #334155; font-size: 16px;"><strong>Trait Library</strong> — Access our complete genetic database</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0;">
                  <span style="color: #10b981; font-size: 18px; margin-right: 12px;">✓</span>
                  <span style="color: #334155; font-size: 16px;"><strong>Community Access</strong> — Connect with fellow genetics enthusiasts</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- FINAL CTA SECTION -->
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%); padding: 60px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center">
            <h2 style="color: #ffffff; font-size: 36px; font-weight: 800; margin: 0 0 15px 0;">
              Ready to Transform Your<br/>Genetics Learning?
            </h2>
            <p style="color: #d1fae5; font-size: 18px; margin: 0 0 30px 0;">
              Join now and start your journey in under 2 minutes!
            </p>
            
            <a href="https://zygotrix.com/signup" style="display: inline-block; background: #ffffff; color: #059669; padding: 18px 50px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 18px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);">
              🧬 Create Your Free Account
            </a>
            
            <p style="color: #a7f3d0; font-size: 14px; margin-top: 25px;">
              ⚡ Limited Time: Get early access to our upcoming DNA sequencing tools!
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`,
};

const AdminEmailMarketingPage: React.FC = () => {
  useDocumentTitle("Email Marketing");

  const { user: currentUser } = useAuth();
  const [newsletterSubscribers, setNewsletterSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deletingEmail, setDeletingEmail] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "newsletter" | "system">("all");

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    email: string;
  }>({ isOpen: false, email: "" });

  // Selection state
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  // Custom email input state
  const [customEmailInput, setCustomEmailInput] = useState("");
  const [customEmails, setCustomEmails] = useState<string[]>([]);

  // Email composition state
  const [templateType, setTemplateType] =
    useState<SendNewsletterRequest["template_type"]>("changelog");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [editMode, setEditMode] = useState<"code" | "visual">("visual");
  const editorRef = React.useRef<HTMLDivElement>(null);

  // AI Template Generator state
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [aiDescription, setAiDescription] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Template Library state
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [customTemplates, setCustomTemplates] = useState<newsletterApi.EmailTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  // Save Template state
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [saveTemplateName, setSaveTemplateName] = useState("");
  const [saveTemplateDescription, setSaveTemplateDescription] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Store ref to editor - the key prop on the editor forces re-creation on template change
  // dangerouslySetInnerHTML handles the initial content, onInput syncs edits back to state

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const insertHeading = (level: number) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const heading = document.createElement(`h${level}`);

      // If there's selected text, use it
      if (!selection.isCollapsed) {
        heading.textContent = selection.toString();
        range.deleteContents();
        range.insertNode(heading);
      } else {
        // Otherwise create an empty heading
        heading.textContent = `Heading ${level}`;
        range.insertNode(heading);

        // Move cursor to end of heading
        range.setStartAfter(heading);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }

      if (editorRef.current) {
        setContent(editorRef.current.innerHTML);
      }
    }
  };

  const isAdmin =
    currentUser?.user_role === "admin" ||
    currentUser?.user_role === "super_admin";

  useEffect(() => {
    if (isAdmin) {
      fetchRecipients();
    }
  }, [isAdmin]);

  useEffect(() => {
    // Update content state when template changes
    // The editor's key={templateType} prop forces re-mount with new dangerouslySetInnerHTML
    setContent(EXAMPLE_CONTENT[templateType]);
  }, [templateType]);

  const fetchRecipients = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await newsletterApi.getAllRecipients();
      setNewsletterSubscribers(response.newsletter_subscribers);
      setSystemUsers(response.system_users);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch recipients";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleEmailSelection = (email: string) => {
    const newSelected = new Set(selectedEmails);
    if (newSelected.has(email)) {
      newSelected.delete(email);
    } else {
      newSelected.add(email);
    }
    setSelectedEmails(newSelected);
  };

  const toggleSelectAll = () => {
    const filtered = filteredRecipients;
    if (selectedEmails.size === filtered.length && filtered.length > 0) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(filtered.map((recipient) => recipient.email)));
    }
  };

  // Custom email helpers
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const addCustomEmail = () => {
    const email = customEmailInput.trim().toLowerCase();

    if (!email) {
      setError("Please enter an email address");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (customEmails.includes(email) || selectedEmails.has(email)) {
      setError("This email is already added");
      return;
    }

    setCustomEmails((prev) => [...prev, email]);
    setSelectedEmails((prev) => new Set([...prev, email]));
    setCustomEmailInput("");
    setError(null);
  };

  const addMultipleEmails = (emailsText: string) => {
    // Split by comma, semicolon, newline, or space
    const emails = emailsText
      .split(/[,;\n\s]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e && isValidEmail(e));

    if (emails.length === 0) {
      setError("No valid emails found");
      return;
    }

    const newCustomEmails: string[] = [];
    const newSelectedEmails = new Set(selectedEmails);

    emails.forEach((email) => {
      if (!customEmails.includes(email) && !newSelectedEmails.has(email)) {
        newCustomEmails.push(email);
        newSelectedEmails.add(email);
      }
    });

    if (newCustomEmails.length === 0) {
      setError("All emails are already added");
      return;
    }

    setCustomEmails((prev) => [...prev, ...newCustomEmails]);
    setSelectedEmails(newSelectedEmails);
    setCustomEmailInput("");
    setError(null);
    setSuccessMessage(`Added ${newCustomEmails.length} email(s)`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const removeCustomEmail = (email: string) => {
    setCustomEmails((prev) => prev.filter((e) => e !== email));
    setSelectedEmails((prev) => {
      const newSet = new Set(prev);
      newSet.delete(email);
      return newSet;
    });
  };

  // AI Template Generation
  const handleGenerateWithAI = async () => {
    if (!aiDescription.trim()) {
      setAiError("Please describe the email template you want to generate");
      return;
    }

    try {
      setAiGenerating(true);
      setAiError(null);

      const result = await newsletterApi.generateTemplateWithAI({
        description: aiDescription,
        template_type: templateType,
      });

      setContent(result.html);
      setShowAIGenerator(false);
      setAiDescription("");
      setSuccessMessage(`AI template generated successfully! Used ${result.token_usage.input_tokens + result.token_usage.output_tokens} tokens.`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate template";
      setAiError(errorMessage);
    } finally {
      setAiGenerating(false);
    }
  };

  // Template Library
  const loadTemplateLibrary = async () => {
    try {
      setTemplatesLoading(true);
      const response = await newsletterApi.getCustomTemplates();
      setCustomTemplates(response.templates);
    } catch (err: unknown) {
      console.error("Failed to load templates:", err);
      setError("Failed to load template library");
    } finally {
      setTemplatesLoading(false);
    }
  };

  const loadTemplate = (template: newsletterApi.EmailTemplate) => {
    setContent(template.html);
    setShowTemplateLibrary(false);
    setSuccessMessage(`Loaded template: ${template.name}`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      await newsletterApi.deleteCustomTemplate(templateId);
      setCustomTemplates((prev) => prev.filter((t) => t._id !== templateId));
      setSuccessMessage("Template deleted successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      console.error("Failed to delete template:", err);
      setError("Failed to delete template");
    }
  };

  // Save Current Template
  const handleSaveTemplate = async () => {
    if (!saveTemplateName.trim()) {
      setError("Please enter a template name");
      return;
    }

    if (!content.trim()) {
      setError("No content to save");
      return;
    }

    try {
      setSavingTemplate(true);
      setError(null);

      await newsletterApi.saveCustomTemplate({
        name: saveTemplateName,
        html: content,
        description: saveTemplateDescription || `Custom ${templateType} template`,
        template_type: templateType,
      });

      setShowSaveTemplate(false);
      setSaveTemplateName("");
      setSaveTemplateDescription("");
      setSuccessMessage("Template saved successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save template";
      setError(errorMessage);
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleSendNewsletter = async () => {
    if (selectedEmails.size === 0) {
      setError("Please select at least one recipient or add a custom email");
      return;
    }

    if (!subject.trim()) {
      setError("Please enter a subject line");
      return;
    }

    if (!content.trim()) {
      setError("Please enter email content");
      return;
    }

    try {
      setSending(true);
      setError(null);
      setSuccessMessage(null);

      const result = await newsletterApi.sendNewsletter({
        recipient_emails: Array.from(selectedEmails),
        template_type: templateType,
        subject: subject.trim(),
        content: content.trim(),
      });

      setSuccessMessage(
        `Successfully sent ${result.success} email(s)${result.failed > 0 ? `, ${result.failed} failed` : ""
        }`
      );

      setSelectedEmails(new Set());
      setSubject("");
      setContent(EXAMPLE_CONTENT[templateType]);

      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to send newsletter";
      setError(errorMessage);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteClick = (email: string) => {
    setConfirmModal({ isOpen: true, email });
  };

  const handleConfirmDelete = async () => {
    const email = confirmModal.email;

    try {
      setDeletingEmail(email);
      setError(null);

      await newsletterApi.unsubscribeFromNewsletter(email);

      // Remove from list
      setNewsletterSubscribers((prev) => prev.filter((sub) => sub.email !== email));

      // Remove from selection if selected
      if (selectedEmails.has(email)) {
        const newSelected = new Set(selectedEmails);
        newSelected.delete(email);
        setSelectedEmails(newSelected);
      }

      setSuccessMessage(`Successfully unsubscribed ${email}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to unsubscribe email";
      setError(errorMessage);
    } finally {
      setDeletingEmail(null);
    }
  };

  type Recipient = (NewsletterSubscriber | SystemUser) & {
    displayName?: string;
  };

  const allRecipients: Recipient[] = [
    ...newsletterSubscribers.map(sub => ({ ...sub, displayName: sub.email })),
    ...systemUsers.map(user => ({
      ...user,
      displayName: user.full_name ? `${user.full_name} (${user.email})` : user.email
    }))
  ];

  const getFilteredRecipients = (): Recipient[] => {
    let recipients: Recipient[] = [];

    if (activeTab === "all") {
      recipients = allRecipients;
    } else if (activeTab === "newsletter") {
      recipients = newsletterSubscribers.map(sub => ({ ...sub, displayName: sub.email }));
    } else {
      recipients = systemUsers.map(user => ({
        ...user,
        displayName: user.full_name ? `${user.full_name} (${user.email})` : user.email
      }));
    }

    return recipients.filter((recipient) =>
      recipient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (recipient.displayName?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const filteredRecipients = getFilteredRecipients();

  const selectAllChecked =
    filteredRecipients.length > 0 &&
    selectedEmails.size === filteredRecipients.length;

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <MdError className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Access Denied
            </h2>
            <p className="text-gray-500 dark:text-slate-400">
              You need admin privileges to access this page.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const selectedTemplate = TEMPLATE_TYPES.find((t) => t.value === templateType);

  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${selectedTemplate?.color}`}>
              <MdEmail className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Email Campaigns
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Create, design, and send beautiful email campaigns
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
            <MdPeople className="w-5 h-5 text-gray-400 dark:text-slate-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {newsletterSubscribers.length + systemUsers.length}
            </span>
            <span className="text-sm text-gray-500 dark:text-slate-400">total recipients</span>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MdCheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span className="text-emerald-600 dark:text-emerald-400 text-sm">{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400"
            >
              <MdClose className="w-5 h-5" />
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MdError className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-red-600 dark:text-red-400 text-sm">{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-600 dark:hover:text-red-400"
            >
              <MdClose className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-12 gap-4">
          {/* Left Sidebar - Recipients */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
              {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Recipients
                  </h2>
                  <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-medium">
                    {selectedEmails.size} selected
                  </span>
                </div>

                {/* Search */}

                {/* Tabs */}
                <div className="flex gap-1 mb-3 bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab("all")}
                    className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${activeTab === "all"
                      ? "bg-emerald-500 text-white"
                      : "text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white"
                      }`}
                  >
                    All ({newsletterSubscribers.length + systemUsers.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("newsletter")}
                    className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${activeTab === "newsletter"
                      ? "bg-emerald-500 text-white"
                      : "text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white"
                      }`}
                  >
                    Newsletter ({newsletterSubscribers.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("system")}
                    className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${activeTab === "system"
                      ? "bg-emerald-500 text-white"
                      : "text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white"
                      }`}
                  >
                    Users ({systemUsers.length})
                  </button>
                </div>

                <div className="relative">
                  <MdEmail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search emails..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Select All */}
                <label className="flex items-center gap-2 mt-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectAllChecked}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-gray-500 dark:text-slate-400 group-hover:text-gray-700 dark:group-hover:text-slate-300">
                    Select all ({filteredRecipients.length})
                  </span>
                </label>
              </div>

              {/* Recipient List */}
              <div className="max-h-[500px] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <BiLoaderAlt className="w-6 h-6 text-emerald-500 animate-spin" />
                  </div>
                ) : filteredRecipients.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <MdPeople className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-400 dark:text-slate-500">
                      {searchTerm ? "No matches found" : "No recipients yet"}
                    </p>
                  </div>
                ) : (
                  filteredRecipients.map((recipient) => (
                    <div
                      key={recipient._id}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700/50 last:border-0 group"
                    >
                      <label className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedEmails.has(recipient.email)}
                          onChange={() => toggleEmailSelection(recipient.email)}
                          className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-emerald-500 focus:ring-emerald-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-gray-600 dark:text-slate-300 truncate group-hover:text-gray-900 dark:group-hover:text-white">
                              {recipient.displayName || recipient.email}
                            </p>
                            {recipient.type === "newsletter_subscriber" ? (
                              <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded text-xs font-medium flex-shrink-0">
                                Newsletter
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded text-xs font-medium flex-shrink-0">
                                User
                              </span>
                            )}
                          </div>
                        </div>
                      </label>
                      {recipient.type === "newsletter_subscriber" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(recipient.email);
                          }}
                          disabled={deletingEmail === recipient.email}
                          className="flex-shrink-0 p-1.5 text-gray-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Unsubscribe this email"
                        >
                          {deletingEmail === recipient.email ? (
                            <BiLoaderAlt className="w-4 h-4 animate-spin" />
                          ) : (
                            <MdDelete className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Custom Email Section */}
            <div className="mt-4 bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <MdEmail className="w-4 h-4 text-pink-500" />
                  Add Custom Emails
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  Send to any email address
                </p>
              </div>

              <div className="p-4 space-y-3">
                {/* Email Input */}
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Enter email address..."
                    value={customEmailInput}
                    onChange={(e) => setCustomEmailInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (customEmailInput.includes(",") || customEmailInput.includes(";") || customEmailInput.includes(" ")) {
                          addMultipleEmails(customEmailInput);
                        } else {
                          addCustomEmail();
                        }
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customEmailInput.includes(",") || customEmailInput.includes(";") || customEmailInput.includes(" ")) {
                        addMultipleEmails(customEmailInput);
                      } else {
                        addCustomEmail();
                      }
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-lg text-sm font-medium transition-all"
                  >
                    Add
                  </button>
                </div>

                <p className="text-xs text-gray-400 dark:text-slate-500">
                  💡 Tip: Paste multiple emails separated by commas, semicolons, or spaces
                </p>

                {/* Custom Emails List */}
                {customEmails.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500 dark:text-slate-400">
                        Custom emails ({customEmails.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          customEmails.forEach((email) => {
                            setSelectedEmails((prev) => {
                              const newSet = new Set(prev);
                              newSet.delete(email);
                              return newSet;
                            });
                          });
                          setCustomEmails([]);
                        }}
                        className="text-xs text-red-500 hover:text-red-600 dark:hover:text-red-400"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {customEmails.map((email) => (
                        <span
                          key={email}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-pink-100 dark:bg-pink-500/20 text-pink-700 dark:text-pink-300 rounded-full text-xs"
                        >
                          {email}
                          <button
                            type="button"
                            onClick={() => removeCustomEmail(email)}
                            className="p-0.5 hover:bg-pink-200 dark:hover:bg-pink-500/30 rounded-full transition-colors"
                          >
                            <MdClose className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content - Email Composer */}
          <div className="lg:col-span-9 space-y-4">
            {/* Template Selection */}
            <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <HiSparkles className="w-5 h-5 text-amber-500" />
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Email Template
                </h2>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {TEMPLATE_TYPES.map((template) => {
                  const Icon = template.icon;
                  const isSelected = templateType === template.value;
                  return (
                    <button
                      key={template.value}
                      onClick={() => setTemplateType(template.value)}
                      className={`relative p-4 rounded-xl border-2 transition-all text-left ${isSelected
                        ? `${template.borderColor} bg-gray-50 dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 shadow-lg`
                        : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-gray-300 dark:hover:border-slate-600"
                        }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={`p-2 rounded-lg ${isSelected
                            ? template.color
                            : "bg-gray-100 dark:bg-slate-700"
                            }`}
                        >
                          <Icon
                            className={`w-4 h-4 ${isSelected ? "text-white" : "text-gray-500 dark:text-slate-400"
                              }`}
                          />
                        </div>
                        <h3
                          className={`text-sm font-semibold ${isSelected ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-slate-300"
                            }`}
                        >
                          {template.label}
                        </h3>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-slate-500">
                        {template.description}
                      </p>
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <div
                            className={`w-2 h-2 rounded-full ${template.color}`}
                          />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* AI Template Actions */}
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setShowAIGenerator(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-lg text-sm font-medium shadow-lg transition-all"
                >
                  <HiSparkles className="w-4 h-4" />
                  Generate with AI
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowTemplateLibrary(true);
                    loadTemplateLibrary();
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-white border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium transition-colors"
                >
                  <FaNewspaper className="w-4 h-4" />
                  Template Library
                </button>
                <button
                  type="button"
                  onClick={() => setShowSaveTemplate(true)}
                  disabled={!content.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MdCheckCircle className="w-4 h-4" />
                  Save Template
                </button>
              </div>
            </div>

            {/* Email Content */}
            <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                Compose Email
              </h2>

              <div className="space-y-4">
                {/* Subject */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-2">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter a compelling subject line..."
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Content */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-medium text-gray-500 dark:text-slate-400">
                      Email Content
                    </label>
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => setEditMode("visual")}
                        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${editMode === "visual"
                          ? "bg-emerald-500 text-white"
                          : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white"
                          }`}
                      >
                        Visual
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditMode("code")}
                        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${editMode === "code"
                          ? "bg-emerald-500 text-white"
                          : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white"
                          }`}
                      >
                        HTML
                      </button>
                    </div>
                  </div>

                  {editMode === "code" ? (
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Enter HTML content..."
                      rows={10}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  ) : (
                    <div className="border-2 border-gray-300 dark:border-slate-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500">
                      {/* Formatting Toolbar */}
                      <div className="flex items-center gap-1 p-2 bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600 flex-wrap">
                        {/* Headings */}
                        <div className="flex items-center gap-1 pr-2 border-r border-gray-200 dark:border-slate-600">
                          <button
                            type="button"
                            onClick={() => insertHeading(1)}
                            className="p-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition-colors"
                            title="Heading 1"
                          >
                            <span className="text-xs font-bold">H1</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => insertHeading(2)}
                            className="p-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition-colors"
                            title="Heading 2"
                          >
                            <span className="text-xs font-bold">H2</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => insertHeading(3)}
                            className="p-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition-colors"
                            title="Heading 3"
                          >
                            <span className="text-xs font-bold">H3</span>
                          </button>
                        </div>

                        {/* Text Formatting */}
                        <div className="flex items-center gap-1 pr-2 border-r border-gray-200 dark:border-slate-600">
                          <button
                            type="button"
                            onClick={() => executeCommand("bold")}
                            className="p-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition-colors"
                            title="Bold"
                          >
                            <MdFormatBold className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => executeCommand("italic")}
                            className="p-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition-colors"
                            title="Italic"
                          >
                            <MdFormatItalic className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => executeCommand("underline")}
                            className="p-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition-colors"
                            title="Underline"
                          >
                            <MdFormatUnderlined className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Lists */}
                        <div className="flex items-center gap-1 pr-2 border-r border-gray-200 dark:border-slate-600">
                          <button
                            type="button"
                            onClick={() => executeCommand("insertUnorderedList")}
                            className="p-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition-colors"
                            title="Bullet List"
                          >
                            <MdFormatListBulleted className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => executeCommand("insertOrderedList")}
                            className="p-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition-colors"
                            title="Numbered List"
                          >
                            <MdFormatListNumbered className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Other */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const url = prompt("Enter URL:");
                              if (url) executeCommand("createLink", url);
                            }}
                            className="p-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition-colors"
                            title="Insert Link"
                          >
                            <MdLink className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => executeCommand("formatBlock", "<p>")}
                            className="p-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition-colors text-xs font-medium"
                            title="Paragraph"
                          >
                            P
                          </button>
                        </div>
                      </div>

                      {/* Editor */}
                      <div
                        key={templateType} // Force re-render when template changes
                        ref={editorRef}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={(e) => {
                          const target = e.target as HTMLDivElement;
                          setContent(target.innerHTML);
                        }}
                        onBlur={(e) => {
                          const target = e.target as HTMLDivElement;
                          setContent(target.innerHTML);
                        }}
                        dangerouslySetInnerHTML={{ __html: content }}
                        className="w-full min-h-[250px] max-h-[400px] px-4 py-3 bg-white text-sm text-gray-800 focus:outline-none prose prose-sm max-w-none overflow-auto"
                      />
                    </div>
                  )}
                  <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">
                    {editMode === "visual"
                      ? "Use the toolbar to format your email. Click to edit, select text to format."
                      : "Write or paste HTML code. Switch to Visual mode to see the preview."}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleSendNewsletter}
                    disabled={sending || selectedEmails.size === 0}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${selectedTemplate?.color
                      } ${selectedTemplate?.hoverColor
                      } text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {sending ? (
                      <>
                        <BiLoaderAlt className="w-5 h-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <MdSend className="w-5 h-5" />
                        Send to {selectedEmails.size} Recipient
                        {selectedEmails.size !== 1 && "s"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, email: "" })}
        onConfirm={handleConfirmDelete}
        title="Unsubscribe Email"
        message={`Are you sure you want to unsubscribe ${confirmModal.email} from the newsletter? This action cannot be undone.`}
        confirmText="Unsubscribe"
        cancelText="Cancel"
        type="danger"
        isLoading={deletingEmail === confirmModal.email}
      />

      {/* AI Template Generator Modal */}
      {showAIGenerator && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
                    <HiSparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Generate Email with AI
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      Describe your email and let Claude create it
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAIGenerator(false);
                    setAiDescription("");
                    setAiError(null);
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <MdClose className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {aiError && (
                <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg flex items-center gap-2">
                  <MdError className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-sm text-red-600 dark:text-red-400">{aiError}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Describe Your Email
                </label>
                <textarea
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  placeholder="E.g., Create a promotional email for our summer sale with vibrant orange and yellow colors, featuring product showcases, discount badges, and a big 'Shop Now' call-to-action button. Include sections for featured products and customer testimonials."
                  rows={6}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">
                  Be specific about colors, layout, sections, and call-to-actions you want.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleGenerateWithAI}
                  disabled={aiGenerating || !aiDescription.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-lg font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {aiGenerating ? (
                    <>
                      <BiLoaderAlt className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <HiSparkles className="w-5 h-5" />
                      Generate Template
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowAIGenerator(false);
                    setAiDescription("");
                    setAiError(null);
                  }}
                  disabled={aiGenerating}
                  className="px-6 py-3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Library Modal */}
      {showTemplateLibrary && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500 rounded-lg">
                    <FaNewspaper className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Template Library
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      Browse and load your saved templates
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTemplateLibrary(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <MdClose className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {templatesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <BiLoaderAlt className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
              ) : customTemplates.length === 0 ? (
                <div className="text-center py-12">
                  <FaNewspaper className="w-16 h-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-slate-400">
                    No saved templates yet. Generate one with AI or save your current design!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customTemplates.map((template) => (
                    <div
                      key={template._id}
                      className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <div className="h-48 overflow-hidden bg-gray-100 dark:bg-slate-700">
                        <div
                          className="w-full h-full overflow-auto text-[8px] pointer-events-none"
                          dangerouslySetInnerHTML={{ __html: template.html }}
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {template.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mb-3 line-clamp-2">
                          {template.description}
                        </p>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded text-xs font-medium">
                            {template.template_type}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-slate-500">
                            {new Date(template.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => loadTemplate(template)}
                            className="flex-1 px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            Load
                          </button>
                          <button
                            onClick={() => deleteTemplate(template._id)}
                            className="px-3 py-2 bg-red-100 dark:bg-red-500/20 hover:bg-red-200 dark:hover:bg-red-500/30 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                          >
                            <MdDelete className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Save Template Modal */}
      {showSaveTemplate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500 rounded-lg">
                    <MdCheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Save Template
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setShowSaveTemplate(false);
                    setSaveTemplateName("");
                    setSaveTemplateDescription("");
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <MdClose className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={saveTemplateName}
                  onChange={(e) => setSaveTemplateName(e.target.value)}
                  placeholder="E.g., Summer Sale 2025"
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={saveTemplateDescription}
                  onChange={(e) => setSaveTemplateDescription(e.target.value)}
                  placeholder="Brief description of this template..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSaveTemplate}
                  disabled={savingTemplate || !saveTemplateName.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingTemplate ? (
                    <>
                      <BiLoaderAlt className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <MdCheckCircle className="w-5 h-5" />
                      Save Template
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowSaveTemplate(false);
                    setSaveTemplateName("");
                    setSaveTemplateDescription("");
                  }}
                  disabled={savingTemplate}
                  className="px-6 py-3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminEmailMarketingPage;
