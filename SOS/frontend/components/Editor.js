"use client"; // this registers <Editor> as a Client Component
import { getRandomUser } from "@/utils/randomuser";
import Link from 'next/link';
// Import necessary icons and libraries
import { MdEdit, MdSave, MdPictureAsPdf, MdUndo } from 'react-icons/md'; // Added Undo icon
import publicUrl from '@/utils/publicUrl';
import React, { useRef } from "react";
import axios from "axios";
import EditorSidebar from "./EditorSidebar";
import EditorInfo from "./EditorInfo";
import EditorNav from "./EditorNav";
import { HiDotsVertical } from "react-icons/hi";
import { BlockNoteView, SideMenu, useBlockNote, Theme, darkDefaultTheme } from "@blocknote/react";
import "@blocknote/core/style.css";
import { useTheme } from "next-themes";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { markdownToPlainText } from "../utils/markdown_to_text";
import { toast } from 'react-hot-toast'; // Import toast for feedback
import { MdOutlineQuiz, MdSummarize } from 'react-icons/md';

// Import PDF generation libraries
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { marked } from 'marked'; // Import marked for Markdown to HTML conversion

// Our <Editor> component we can reuse later
export default function Editor({ data, id }) {
    // Theme
    const { theme } = useTheme();

    // Ref for the editor content area to capture for PDF
    const editorContentRef = useRef(null);

    // content is the doc where docId == id
    const content = data.content;
    const initData = content.map((block) => {
        // Ensure content handling is robust for different block types
        let blockContent = block.content;
        if (Array.isArray(block.content) && block.content[0]?.text !== undefined) {
            blockContent = block.content[0].text;
        } else if (typeof block.content === 'string') {
            blockContent = block.content;
        } else {
            blockContent = '';
        }

        return {
            id: `${block.id}`,
            type: `${block.type}`,
            props: block.props || {},
            content: blockContent,
            children: block.children || [],
        };
    });

    // Initialize the BlockNote editor without collaboration
    const editor = useBlockNote({
        initialContent: initData,
        onEditorContentChange: (editor) => {
            // Handle changes if needed, without collaboration-specific logging
            return;
        }
    });

    // Theme override for dark mode (custom dark theme)
    const darkRedTheme = {
        ...darkDefaultTheme,
        colors: {
            ...darkDefaultTheme.colors,
            editor: {
                ...darkDefaultTheme.colors.editor,
                background: "#1f2937",
            },
            sideMenu: darkDefaultTheme.colors.sideMenu || "#ffffff",
            tooltip: darkDefaultTheme.colors.tooltip || "#ffffff",
            highlights: darkDefaultTheme.colors.highlights,
        },
    };

    // Save note function
    const handleSave = async () => {
        const toastId = toast.loading("Saving note...");
        try {
            const md = await editor.blocksToMarkdownLossy(editor.topLevelBlocks);
            const preview = markdownToPlainText(md);
            const headingBlock = editor.topLevelBlocks.find((block) => block.type === "heading");
            const noteTitle = headingBlock?.content?.[0]?.text || data.title || "Untitled Note";

            console.log("Saving note via:", `${publicUrl()}/notes/note/${id}`);
            const res = await axios.put(`${publicUrl()}/notes/note/${id}`, {
                title: noteTitle,
                content: editor.topLevelBlocks,
                preview: preview,
            });
            toast.success("Note saved!", { id: toastId });
            console.log("Note saved:", res.data);
        } catch (error) {
            console.error("Error saving note:", error);
            toast.error(`Error saving: ${error.response?.data?.message || error.message}`, { id: toastId });
        }
    };

    // PDF Export Function
    const handleExportPDF = async () => {
        const toastId = toast.loading("Generating PDF...");

        try {
            // Convert blocks to markdown
            const markdown = await editor.blocksToMarkdownLossy(editor.topLevelBlocks);
            
            // Get title from the first heading or use the document title
            const headingBlock = editor.topLevelBlocks.find((block) => block.type === "heading");
            const noteTitle = headingBlock?.content?.[0]?.text || data.title || "Untitled Note";
            
            // Create PDF document
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'pt',
                format: 'a4'
            });
            
            // Set document properties
            pdf.setProperties({
                title: noteTitle,
                subject: 'Note Export',
                creator: 'SOS Notes App'
            });
            
            // Document dimensions
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 50; // Margins in points
            const contentWidth = pageWidth - (margin * 2);
            
            // Add title
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(20);
            pdf.setTextColor(0, 0, 0);
            pdf.text(noteTitle, margin, margin + 10);
            
            // Add horizontal rule
            pdf.setDrawColor(200, 200, 200);
            pdf.setLineWidth(0.5);
            pdf.line(margin, margin + 25, pageWidth - margin, margin + 25);
            
            // Set content font
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(12);
            
            // Process markdown content by sections
            const sections = markdown.split(/(?=^#+\s)/m);
            let y = margin + 50; // Start position after title

            // Function to add text and handle pagination
            const addTextWithPagination = (textLines, isCode = false) => {
                const lineHeight = isCode ? 10 : 14; // Smaller line height for code
                const paragraphSpacing = isCode ? 5 : 10;
                pdf.setFont(isCode ? "courier" : "helvetica", "normal");
                pdf.setFontSize(isCode ? 10 : 12);

                for (const line of textLines) {
                    if (y + lineHeight > pageHeight - margin) {
                        pdf.addPage();
                        y = margin + 20; // Reset y for new page (leave space for potential header)
                        pdf.setFont(isCode ? "courier" : "helvetica", "normal"); // Reset font on new page
                        pdf.setFontSize(isCode ? 10 : 12);
                    }
                    pdf.text(line, margin, y);
                    y += lineHeight;
                }
                y += paragraphSpacing; // Add spacing after the block of text
            };

            // Process each section
            for (const section of sections) {
                if (section.trim() === '') continue;

                // Initial page check for the start of the section
                if (y > pageHeight - (margin + 50)) { // Add some buffer for potential headers/content
                    pdf.addPage();
                    y = margin + 20;
                }
                
                // Handle headers specially
                const headerMatch = section.match(/^(#+)\s+(.*)$/m);
                if (headerMatch) {
                    const headerLevel = headerMatch[1].length;
                    const headerText = headerMatch[2].trim();
                    let headerSize = 14;
                    let headerSpacing = 16;

                    // Add spacing before headers
                    y += 15;
                    
                    if (y > pageHeight - margin) { // Check again after adding spacing
                       pdf.addPage();
                       y = margin + 20;
                    }

                    // Different sizes for different header levels
                    if (headerLevel === 1) {
                        headerSize = 18; headerSpacing = 20;
                    } else if (headerLevel === 2) {
                        headerSize = 16; headerSpacing = 18;
                    } // else use default 14/16

                    pdf.setFont("helvetica", "bold");
                    pdf.setFontSize(headerSize);
                    pdf.text(headerText, margin, y);
                    y += headerSpacing;
                    
                    // Reset font for content
                    pdf.setFont("helvetica", "normal");
                    pdf.setFontSize(12);
                    
                    // Find the content after the header
                    const contentAfterHeader = section.replace(/^#+\s+.*$/m, '').trim();
                    if (contentAfterHeader) {
                        // --- Start Refined Content Handling ---
                        const lines = pdf.splitTextToSize(contentAfterHeader, contentWidth);
                        addTextWithPagination(lines);
                        // --- End Refined Content Handling ---
                    }
                } else {
                    // --- Start Refined Content Handling ---
                    // Handle regular content (potentially including lists, code blocks etc. - simplified for now)
                    const lines = pdf.splitTextToSize(section, contentWidth);
                    addTextWithPagination(lines);
                    // --- End Refined Content Handling ---
                }
            }
            
            // Special handling for code blocks, lists, and other elements
            // This is a more advanced implementation that would require parsing markdown
            // more thoroughly, which we're simplifying for this example
            
            // Save the PDF
            const filename = noteTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.pdf';
            pdf.save(filename);
            
            toast.success("PDF generated!", { id: toastId });
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast.error(`Failed to generate PDF: ${error.message}`, { id: toastId });
        }
    };

    // Summarize note function
    const handleSummarize = async () => {
        const toastId = toast.loading("Generating summary...");
        try {
            console.log("Summarizing via:", `${publicUrl()}/notes/summarize/${id}`);
            const res = await axios.post(`${publicUrl()}/notes/summarize/${id}`);
            toast.success("Summary note created!", { id: toastId });
            console.log("Summary note created:", res.data);
        } catch (error) {
            console.error("Error generating summary:", error);
            toast.error(`Error: ${error.response?.data?.message || error.message}`, { id: toastId });
        }
    };

    // Generate quiz questions function
    const handleGenerateQuiz = async () => {
        const toastId = toast.loading("Generating quiz questions...");
        try {
            console.log("Generating quiz via:", `${publicUrl()}/notes/quiz/${id}`);
            const res = await axios.post(`${publicUrl()}/notes/quiz/${id}`);
            toast.success("Quiz questions note created!", { id: toastId });
            console.log("Quiz questions note created:", res.data);
        } catch (error) {
            console.error("Error generating quiz questions:", error);
            toast.error(`Error: ${error.response?.data?.message || error.message}`, { id: toastId });
        }
    };

    // Undo function
    const handleUndo = () => {
        const toastId = toast.loading("Undoing...");
        try {
            editor._tiptapEditor.commands.undo();
            toast.success("Undo successful!", { id: toastId });
        } catch (error) {
            console.error("Error during undo:", error);
            toast.error(`Error during undo: ${error.message}`, { id: toastId });
        }
    };

    // Render the editor
    return (
        content && (
            <main className={`conatiner flex bg-white h-screen dark:bg-gray-800`}>
                <Sidebar />
                <div className="flex-1 overflow-y-scroll border-l-2 border-gray-200 dark:border-gray-600">
                    <div className="border-b-2 dark:border-gray-600 px-6 py-3 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
                        <h3 className="font-semibold max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl truncate" title={data.title}>
                            {data.title || "Untitled Note"}
                        </h3>

                        <div className="options flex items-center gap-2 flex-shrink-0">
                            <button
                                onClick={handleExportPDF}
                                title="Export as PDF"
                                className="flex items-center gap-1 text-sm hover:bg-gray-200 dark:hover:bg-gray-700 font-medium cursor-pointer px-2 py-1 rounded-md dark:text-gray-200"
                            >
                                <MdPictureAsPdf className="text-lg" />
                                <span className="hidden sm:inline">Export</span>
                            </button>
                            <button
                                onClick={handleSave}
                                title="Save Note"
                                className="flex items-center gap-1 text-sm hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-semibold cursor-pointer px-2 py-1 rounded-md"
                            >
                                <MdSave className="text-lg" />
                                <span className="hidden sm:inline">Save</span>
                            </button>
                            <button
                                onClick={handleSummarize}
                                title="Summarize Note"
                                className="flex items-center gap-1 text-sm hover:bg-gray-200 dark:hover:bg-gray-700 font-medium cursor-pointer px-2 py-1 rounded-md dark:text-gray-200"
                            >
                                <MdSummarize className="text-lg" />
                                <span className="hidden sm:inline">Summarize</span>
                            </button>
                            <button
                                onClick={handleGenerateQuiz}
                                title="Generate Quiz Questions"
                                className="flex items-center gap-1 text-sm hover:bg-gray-200 dark:hover:bg-gray-700 font-medium cursor-pointer px-2 py-1 rounded-md dark:text-gray-200"
                            >
                                <MdOutlineQuiz className="text-lg" />
                                <span className="hidden sm:inline">Quiz</span>
                            </button>
                            <button
                                onClick={handleUndo}
                                title="Undo Changes"
                                className="flex items-center gap-1 text-sm hover:bg-gray-200 dark:hover:bg-gray-700 font-medium cursor-pointer px-2 py-1 rounded-md dark:text-gray-200"
                            >
                                <MdUndo className="text-lg" />
                                <span className="hidden sm:inline">Undo</span>
                            </button>
                            {/* <button title="More options" className="px-2 py-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md dark:text-gray-200">
                                <HiDotsVertical />
                            </button> */}
                        </div>
                    </div>
                    <div className="notes px-6 py-4 min-h-[80vh] items-start mt-4">
                        <div ref={editorContentRef} className="w-full max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800 rounded-md">
                            <BlockNoteView
                                editor={editor}
                                theme={theme === "dark" ? darkRedTheme : 'light'}
                            />
                        </div>
                    </div>
                </div>
            </main>
        )
    );
};