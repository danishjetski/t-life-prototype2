import { motion } from 'framer-motion';
import { Zap, AlertCircle, TrendingUp, Lightbulb } from 'lucide-react';

export default function AdminAIWellnessWidget({
    burnoutAnalytics = {},
    fallbackRecommendations = []
}) {
    const recommendations = burnoutAnalytics?.recommendations?.length > 0
        ? burnoutAnalytics.recommendations
        : fallbackRecommendations;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-xl p-6 mt-6"
        >
            <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Zap size={16} className="text-purple-400" />
                </div>
                <h3 className="text-lg font-outfit font-bold text-white">AI Wellness Recommendations</h3>
            </div>

            {recommendations && recommendations.length > 0 ? (
                <div className="space-y-3">
                    {recommendations.map((recommendation, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * (index + 1) }}
                            className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-purple-500/20"
                        >
                            <div className="mt-0.5">
                                <Lightbulb size={14} className="text-purple-400 flex-shrink-0" />
                            </div>
                            <p className="text-xs font-inter text-gray-300 leading-relaxed">
                                {recommendation}
                            </p>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <AlertCircle size={16} className="text-blue-400 flex-shrink-0" />
                    <p className="text-xs font-inter text-blue-300">
                        No recommendations available yet. Check back when burnout analytics are updated.
                    </p>
                </div>
            )}

            {/* Optional: Show AI powered badge */}
            <div className="mt-4 flex items-center gap-2 text-[9px] font-inter text-gray-500">
                <TrendingUp size={12} />
                <span>Powered by AI Burnout Detection System</span>
            </div>
        </motion.div>
    );
}
