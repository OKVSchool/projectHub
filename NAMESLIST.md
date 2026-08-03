
Name	What it is
projectHub	The app itself
projectList	Home page (/)
projectIdeas	The /ideas page
thoughtsTab	Tab 1 inside projectIdeas
ideasTab	Tab 2 inside projectIdeas
projectsTab	Tab 3 inside projectIdeas
projectCard	Project card on projectList
projectPanel	Project accordion in projectsTab
ideaPanel	Idea accordion in ideasTab
thoughtPanel	Standalone thought accordion in thoughtsTab
nestedThought	Thought accordion inside ideaPanel or projectPanel
taskList	Task section inside any panel
taskItem	Individual task inside a taskList
Plus the component mapping:

Projects tab inside Ideas page → ProjectsTab
Each project row inside Projects tab → ProjectPanel
Thoughts nested inside a ProjectPanel → ThoughtCard
Task list on Project Detail page → TaskList