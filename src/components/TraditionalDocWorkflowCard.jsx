import React from 'react';

const cardData = [
  {
    title: "Step 1",
    desc: "Get started with Flex.ai to optimize your fitness journey.",
    color: "bg-pink-100 border-pink-400 text-pink-700",
    titleColor: "text-pink-700"
  },
  {
    title: "Step 2",
    desc: "Upgrade to Premium for personalized plans and smarter tracking.",
    color: "bg-yellow-100 border-yellow-400 text-yellow-700",
    titleColor: "text-yellow-700"
  },
  {
    title: "Step 3",
    desc: "Explore the video library for expert-guided workouts.",
    color: "bg-green-100 border-green-400 text-green-700",
    titleColor: "text-green-700"
  },
  {
    title: "Step 4",
    desc: "Follow your routine consistently to build strength and stamina.",
    color: "bg-purple-100 border-purple-400 text-purple-700",
    titleColor: "text-purple-700"
  },
  {
    title: "Step 5",
    desc: "Repeat and track progress weekly for long-term results.",
    color: "bg-orange-100 border-orange-400 text-orange-700",
    titleColor: "text-orange-700"
  }
]
;

const TraditionalDocWorkflowCard = () => (
  <div className="max-w-xl mx-auto my-6">
    <h3 className="font-bold text-lg md:text-xl mb-4 text-center">Workflow</h3>
    <div className="flex flex-col gap-4">
      {cardData.map((card, idx) => (
        <div
          key={idx}
          className={`rounded-xl shadow-sm border-l-4 p-4 flex flex-col items-center ${card.color}`}
          style={{ borderLeftWidth: '4px' }}
        >
          <div className={`font-semibold mb-1 text-center ${card.titleColor}`}>{card.title}</div>
          <div className="text-base text-center">{card.desc}</div>
        </div>
      ))}
    </div>
  </div>
);

export default TraditionalDocWorkflowCard;