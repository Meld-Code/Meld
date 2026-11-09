"use strict";
  
  const games = [
    {
      name: "GTA 5",
      url: "https://gta.deloskiyt.pl/",
      image: "Images/GTA5L.png",
      icon: "fa-car",
      a: "#6e3b25",
      b: "#171d1a",
      category: "Action",
      description: "Experience the action-packed open world of Los Santos in GTA 5! Explore a massive city, drive incredible vehicles, complete missions, and experience an exciting criminal adventure. Switch between three unique characters and discover everything this vast open world has to offer.",
      isTopRated: true
    },
    {
      name: "Hollow Knight",
      url: "https://play.1gdata.com/15i2c21c/index.html",
      image: "Images/HollowKnight.png",
      icon: "fa-bug",
      a: "#263c57",
      b: "#111521",
      category: "Adventure",
      description: "Explore the mysterious underground kingdom of Hallowwnest in Hollow Knight! Battle dangerous creatures, discorver hidden areas, unlock powerful abilities, and uncover the secrets of a forgotten kingdom. Embark on an atmospheric adventure filled with challenging enemies, epic bosses, and exciting exploration.",
      isTopRated: true
    },
    {
      name: "Minecraft 26.2",
      url: "https://eaglercraft-26-2-u1-cdn.u2471966200.workers.dev/eaglercraft-26.2-u1.html?v=u1-20260930",
      image: "Images/ML.png",
      icon: "fa-cubes",
      a: "#577b42",
      b: "#19291d",
      category: "Sandbox",
      description: "Explore a massive block-based world in Minecraft! Gather Resources, craft tools, build incredible structures, and survive against dangerous mobs. Create your own adventures and let your imagination run wild!",
      isTopRated: true
    },
    {
      name: "Hacked Minecraft 1.8.8",
      url: "https://meld-code.github.io/MC/DragonX_V2_International%20(1)%20(1)%20(3).html",
      image: "Images/ML.png",
      icon: "fa-cubes",
      a: "#477a65",
      b: "#14251e",
      category: "Sandbox",
      description: "Play Minecraft 1.8.8 with a twist! Explore, build, and survive in a classic version of Minecraft with access to modified gameplay features. Enjoy familiar block-building adventures with a different experience! and use cheats to give yourself an advantage against other users."
    },
    {
      name: "Roblox",
      url: "https://angst.clawschools.org/embed.html#https://nowgg.fun/apps/a/19900/b.html",
      image: "Images/RBL.png",
      icon: "fa-gamepad",
      a: "#707579",
      b: "#1a1c20",
      category: "Adventure",
      description: "Explore millions of player-created experiences in Roblox! Play exciting games, discover unique worlds, customize your avatar, and connect with friends. From adventures and simulators to obbys and competitive challenges, there's always something new to play!",
      isTopRated: true
    },
    {
      name: "Minecraft 1.8.8",
      url: "https://meld-code.github.io/MC/",
      image: "Images/ML.png",
      icon: "fa-cubes",
      a: "#77914c",
      b: "#202b19",
      category: "Sandbox",
      description: "Jump into the classic Minecraft 1.8.8 experience! Explore a blocky world, gather resources, craft items, build amazing structures, and survive against dangerous mobs. Enjoy classic gameplay, iconic combat, and endless creative possibilites!"
    },
    {
      name: "Rocket Soccer Derby",
      url: "https://db.duckmath.org/html/rocket_soccer_derby/",
      image: "Images/RSDL.png",
      icon: "fa-futbol",
      a: "#3d7f8c",
      b: "#15242d",
      category: "Sports",
      description: "Jump into Rocket Soccer Derby, where soccer meets high-spped racing! Drive powerful cars, compete in exciting soccer matches, score incredible goals, and outply your opponents. Take control of the field and become the ultimate Rocket Soccer champion!"
    },
    {
      name: "Cluster Rush",
      url: "https://db.duckmath.org/html/cluster_rush/",
      image: "Images/ClusterRush.png",
      icon: "fa-truck",
      a: "#c57d36",
      b: "#37231b",
      category: "Action",
      description: "Jump into Cluster Rush, a fast-paced platforming game where you must leap between moving trucks, avoid obstacles, and stay on top of the convoy. Test your reflexes, master your timing and see how far you can make it without falling!",
      isUpdated: true
    },
    {
      name: "Steal A Brainrot",
      url: "https://db.duckmath.org/html/steal_a_brainrot_2/",
      image: "Images/SABB.png",
      icon: "fa-brain",
      a: "#a64d77",
      b: "#321a34",
      category: "Simulator",
      description: "Jump into Steal a Brainrot, a chaotic multiplayer game where you collect hilarious Brainrot characters, build your collection, and earn money. Buy rare characters, steal from other player, protect your base, and grow yur brainrot empire!"
    },
    {
      name: "Fan-Made Amoung Us ",
      url: "https://db.duckmath.org/html/among_us/",
      image: "Images/AU.png",
      icon: "fa-user-astronaut",
      a: "#b54d4d",
      b: "#351b26",
      category: "Strategy",
      description: "Experience a fan-made version of Amoung Us! Work together with crewmates, complete tasks, and uncover the imposters hiding amoung you. Use teamwork, deceptio, and clever strategies to survive and win!",
      isUpdated: true
    },
    {
      name: "Ping Pong Go",
      url: "https://tataedu23.github.io/g66/class-924/",
      image: "Images/PPG.png",
      icon: "fa-table-tennis-paddle-ball",
      a: "#3c7f59",
      b: "#152c22",
      category: "Sports",
      description: "Grab your paddle and jump onto exciting table tennis matches in Ping Pong Go! Challenge opponents, master your timing, return powerful shots, and compete to become a ping pong champion. Test your reflexes and see how many matches your can win!",
      isTopRated: true
    },
    {
      name: "Retro Bowl College",
      url: "https://db.duckmath.org/html/retro_bowl_college/",
      image: "Images/RetroBowlCollege.png",
      icon: "fa-football",
      a: "#a87845",
      b: "#33231a",
      category: "Sports",
      description: "Take charge of your own college football team in Retro Bowl College! Recruit talented players, manage your roster, call the plays, and lead your team through an exciting college football season. Build a championship-winning program and fight your way to the top!"
    },
    {
      name: "Minecraft 1.5.2",
      url: "https://catfoolyou.github.io/Eagler-Online/",
      image: "Images/ML.png",
      icon: "fa-cubes",
      a: "#6c8751",
      b: "#202c1a",
      category: "Sandbox",
      description: "Experience classic Minecraft 1.5.2! Explore a blocky world, gather resources, craft items, build amazing structures, and survive against dangerous mobs. Enjoy the nostalgic gameplay of one of Minecraft's classic versions!"
    },
    {
      name: "Minecraft Classic",
      url: "https://db.duckmath.org/html/minecraft_classic/",
      image: "Images/ML.png",
      icon: "fa-cubes",
      a: "#6e9856",
      b: "#23331d",
      category: "Sandbox",
      description: "Go back to where it all began with Minecraft Classic! Build whatever you can imagine using simple blocks, explore your creativity, and create unique structures in this nostalgic version of Minecraft."
    },
    {
      name: "Skate 3",
      url: "https://skate.aaddpp.lol/",
      image: "Images/Skate3.png",
      icon: "fa-person-skating",
      a: "#9c6a43",
      b: "#2b211b",
      category: "Sports",
      description: "Hit the streets in Skate 3 and become a skateboarding legend! Explore an open world, perform incredible tricks, land massive combos, and challenge yourself to master every obstacle. Grab your board and show off your skills!",
      isTopRated: true
    },
    {
      name: "60 Seconds",
      url: "https://meld-code.github.io/files/60Seconds.html",
      image: "Images/60Seconds.png",
      icon: "fa-hourglass-half",
      a: "#9c6a43",
      b: "#2b211b",
      category: "Strategy",
      description: "Survive a nuclear apocalypse in 60 Seconds! Make quick decisions, collect supplies, and prepare your family for life inside a fallout shelter. Manage your resources, face unexpected challenges, and see how long you can survive!"
    },
    {
      name: "8 Ball Pool",
      url: "https://meld-code.github.io/files/8BallPool.html",
      image: "Images/8BallPool.png",
      icon: "fa-circle-dot",
      a: "#9c6a43",
      b: "#2b211b",
      category: "Sports",
      description: "Rack up the balls and get ready for 8 Ball Pool! Aim carefully, plan your shots, and use your skills to sink every ball. Challenge opponents, master the table, and prove you're a pool champion!"
    },
    {
      name: "Baldi's Basics",
      url: "https://meld-code.github.io/files/BaldiBasics.html",
      image: "",
      icon: "fa-school",
      a: "#9c6a43",
      b: "#2b211b",
      category: "Horror",
      description: "Enter a strange schoolhouse in Baldi's Basics! Collect notebooks, solve math problems, and explore the hallways while avoiding Baldi and other unusual characters. Stay alert, find your way around, and try to escape the school!"
    },
    {
      name: "Counter Strike 1.6",
      url: "https://meld-code.github.io/files/CS16.html",
      image: "",
      icon: "fa-crosshairs",
      a: "#9c6a43",
      b: "#2b211b",
      category: "Action",
      description: "Experience the classic Counter-Strike 1.6! Compete in intense team-based matches, test your reflexes, and work with your teammates to complete objectives."
    },
    {
      name: "Call Of Battle",
      url: "https://meld-code.github.io/files/CallOfBattle.html",
      image: "",
      icon: "fa-",
      a: "#9c6a43",
      b: "#2b211b",
      category: "Fps",
      description: "A fun shooter game."
    },
    {
      name: "Celeste",
      url: "https://meld-code.github.io/files/Celeste.html",
      image: "Images/Celeste.png",
      icon: "fa-mountain",
      a: "#9c6a43",
      b: "#2b211b",
      category: "Platformer",
      description: "Climb the mysterious Celeste Mountain! Jump across dangerous obstacles, master difficult levels, and help Madeline reach the summit."
    },
    {
      name: "Cheese Chompers",
      url: "https://meld-code.github.io/files/CheeseChompers.html",
      image: "Images/CheeseChompers.png",
      icon: "fa-cheese",
      a: "#9c6a43",
      b: "#2b211b",
      category: "RPG",
      description: "A cheese game."
    },
    {
      name: "Chicken War",
      url: "https://meld-code.github.io/files/ChickenWar.html",
      image: "",
      icon: "fa-egg",
      a: "#9c6a43",
      b: "#2b211b",
      category: "Action",
      description: "Get ready for an exciting chicken-themed battle! Take on opponents, overcome challenges, and see if you can come out on top."
    },
    {
      name: "Crash Out Crew",
      url: "https://meld-code.github.io/files/CrashOutCrew.html",
      image: "",
      icon: "fa-car-side",
      a: "#9c6a43",
      b: "#2b211b",
      category: "Car",
      description: "A car game."
    },
    {
      name: "Death Penalty World Cup",
      url: "https://meld-code.github.io/files/DeathPenaltyWorldCup.html",
      image: "",
      icon: "fa-futbol",
      a: "#9c6a43",
      b: "#2b211b",
      category: "Sports",
      description: "Step onto the football pitch! Take your shots, compete against different teams, and test your penalty-taking skills."
    },
    {
      name: "Death Run 3D",
      url: "https://meld-code.github.io/files/DeathRun.html",
      image: "Images/DeathRun.png",
      icon: "fa-person-running",
      a: "#9c6a43",
      b: "#2b211b",
      category: "Arcade",
      description: "Put your reflexes to the ultimate test! Race through dangerous tunnels, dodge incoming obstacles, and see how far you can survive."
    },
    {
      name: "PokeBonk",
      url: "https://pokebonk.com",
      image: "Images/PokeBonk.png",
      icon: "fa-bowling-ball",
      a: "#9c6a43",
      b: "#2b211b",
      category: "Pokemon",
      description: "A fun Pokemon game.",
      isTopRated: true
    },
    {
      name: "BunnyHop",
      url: "https://bunnyhop.lol",
      image: "Images/BunnyHop.png",
      icon: "fa-arrow-up",
      a: "#9c6a43",
      b: "#2b211b",
      category: "Skill",
      description: "Test your movement skills! Master your timing, maintain your momentum, and navigate challenging courses.",
      isNew: true
    },
    {
      name: "Clutcher",
      url: "https://www.clutcher.io",
      image: "Images/Clutcher.png",
      icon: "fa-trophy",
      a: "#9c6a43",
      b: "#2b211b",
      category: "Skill",
      description: "Put your skills to the test! Take on challenging situations, sharpen your reflexes, and see if you can pull off the perfect play.",
      isNew: true
    },
    {
      name: "Messenger",
      url: "https://messenger.abeto.com",
      image: "Images/.png",
      icon: "fa-globe",
      a: "#9c6a43",
      b: "#2b211b",
      category: "Open World",
      description: "Embark on an exciting adventure! Explore mysterious worlds, overcome challenging obstacles, and discover secrets in a colorful pixel-art adventure.",
      isNew: true
    },
    {
      name: "DeadShot",
      url: "https://deadshot.io/",
      image: "Images/.png",
      icon: "fa-gun",
      a: "#9c6a43",
      b: "#2b211b",
      category: "Fps",
      description: "Test your accuracy in an action-packed gaming experience! Take on challenging levels, improve your precision, and see how well you can perform.",
      isNew: true
    },
    {
      name: "Poke Arena 2D",
      url: "https://pokearena2d.com",
      image: "Images/.png",
      icon: "fa-bowling-ball",
      a: "#9c6a43",
      b: "#2b211b",
      category: "Pokemon",
      description: "Enter a world of creature battles! Discover unique Pokémon-inspired adventures, challenge opponents, and test your abilities in exciting arena battles.",
      isTopRated: true
    },
    {
      name: "MarioKart 8",
      url: "https://mariokart8.online",
      image: "Images/MarioKart8.png",
      icon: "fa-car-burst",
      a: "#9c6a43",
      b: "#2b211b",
      category: "Racing",
      description: "Race through exciting tracks! Choose your favorite characters, compete against rivals, collect power-ups, and use your racing skills to cross the finish line first.",
      isNew: true
    },
    {
      name: "Kour",
      url: "https://kour.io",
      image: "Images/Kour.png",
      icon: "fa-gun",
      a: "#9c6a43",
      b: "#2b211b",
      category: "Fps",
      description: "Jump into a fast-paced multiplayer game! Compete against players from around the world, explore different maps, and challenge yourself in exciting online matches.",
      isNew: true
    },
    {
      name: "Tide Water",
      url: "https://dgreenheck.github.io/tidewater/",
      image: "Images/.png",
      icon: "fa-fish",
      a: "#9c6a43",
      b: "#2b211b",
      category: "Fishing",
      description: "A fun fishing game.",
      isNew: true
    },
    {
      name: "Doodle Shooter",
      url: "https://doodleshooter.vercel.app/",
      image: "Images/.png",
      icon: "fa-gun",
      a: "#9c6a43",
      b: "#2b211b",
      category: "Fps",
      description: "Enjoy a fun doodle-style arcade experience! Take on challenging levels, overcome obstacles, and see how far you can progress.",
      isTopRated: true
    },
    {
      name: "Car Game",
      url: "https://whiteout.plgb.chatgpt.site/",
      image: "Images/.png",
      icon: "fa-car",
      a: "#9c6a43",
      b: "#2b211b",
      category: "Driving",
      description: "Get behind the wheel! Explore different environments, control your vehicle, and take on challenges as you put your driving skills to the test.",
      isNew: true
    },
    {
      name: "Jelly Baby",
      url: "https://jelly.scottsun.io/",
      image: "Images/.png",
      icon: "fa-jar",
      a: "#9c6a43",
      b: "#2b211b",
      category: "Simulator",
      description: "A fun simulator game.",
      isNew: true
    },
    {
      name: "No Merci Michel",
      url: "https://no.merci-michel.com/",
      image: "Images/.png",
      icon: "fa-arm",
      a: "#9c6a43",
      b: "#2b211b",
      category: "2 Player",
      description: "A fun arm-wrestling game.",
      isNew: true
    },
    {
      name: "Tree Stump",
      url: "https://screen.toys/firewood/",
      image: "Images/.png",
      icon: "fa-tree",
      a: "#9c6a43",
      b: "#2b211b",
      category: "Tree Stump",
      description: "Tree Stump.",
      isTopRated: true
    },
    {
      name: "Tiny Skys",
      url: "https://tinyskies.vercel.app/",
      image: "Images/TinySkys.png",
      icon: "fa-plane",
      a: "#9c6a43",
      b: "#2b211b",
      category: "Flying",
      description: "A flying game.",
      isNew: true
    },
    {
      name: "Star Wars Model",
      url: "https://mameson.com/experiment/glsl/fluffed_2/fluffed_2.html",
      image: "Images/StarWarsModel.png",
      icon: "fa-cloud",
      a: "#9c6a43",
      b: "#2b211b",
      category: "Model",
      description: "A Star Wars model.",
      isNew: true
    },
    {
      name: "Kit Racing",
      url: "https://mrdoob.github.io/Starter-Kit-Racing/",
      image: "Images/.png",
      icon: "fa-car",
      a: "#9c6a43",
      b: "#2b211b",
      category: "Driving",
      description: "A fun car game.",
      isNew: true
    },
    {
      name: "Chibi Game",
      url: "https://worawork.vercel.app/",
      image: "Images/.png",
      icon: "fa-doll",
      a: "#9c6a43",
      b: "#2b211b",
      category: "Open World",
      description: "A fun open-world game.",
      isNew: true
    },
    {
      name: "Jelly Tetris",
      url: "https://holtsetio.com/lab/tetris/",
      image: "Images/JellyTetris.png",
      icon: "fa-square",
      a: "#9c6a43",
      b: "#2b211b",
      category: "Mind",
      description: "Put your puzzle-solving skills to the test! Arrange colorful jelly-shaped pieces, complete rows, and aim for the highest score.",
      isNew: true
    },
    {
      name: "Horizon Drive",
      url: "https://www.shopify.com/ca/editions/summer2025/drive",
      image: "Images/HorizonDrive.png",
      icon: "fa-car",
      a: "#9c6a43",
      b: "#2b211b",
      category: "Driving",
      description: "Hit the road! Enjoy an exciting driving experience, explore beautiful environments, and put your driving skills to the test.",
      isNew: true
    },
    {
      name: "Among Us Legacy",
      url: "https://wasm.rip/files/amongus/legacy/",
      image: "Images/AU.png",
      icon: "fa-user-astronaut",
      a: "#9c6a43",
      b: "#2b211b",
      category: "Strategy",
      description: "Join your crewmates aboard a spaceship and work together to complete tasks while trying to uncover the imposters hiding among you. Use teamwork, deception, and clever strategies to survive, expose the imposters, and win the game!",
      isNew: true
    },
    {
      name: "Among Us",
      url: "https://wasm.rip/files/amongus/latest/",
      image: "Images/AU.png",
      icon: "fa-user-astronaut",
      a: "#9c6a43",
      b: "#2b211b",
      category: "Strategy",
      description: "Join your crewmates aboard a spaceship and work together to complete tasks while trying to uncover the imposters hiding among you. Use teamwork, deception, and clever strategies to survive, expose the imposters, and win the game!",
      isTopRated: true
    },
    {
      name: "Cluster Truck",
      url: "https://wasm.rip/files/ClusterTruck/clustertruck.html",
      image: "Images/ClusterRush.png",
      icon: "fa-truck",
      a: "#9c6a43",
      b: "#2b211b",
      category: "Action",
      description: "Jump into Cluster Rush, a fast-paced platforming game where you must leap between moving trucks, avoid obstacles, and stay on top of the convoy. Test your reflexes, master your timing and see how far you can make it without falling!",
      isNew: true
    },
    {
      name: "CupHead",
      url: "https://wasm.rip/files/cuphead/index.html",
      image: "Images/.png",
      icon: "fa-cup",
      a: "#9c6a43",
      b: "#2b211b",
      category: "Action",
      description: "",
      isTopRated: true
    },
    {
      name: "Granny 3",
      url: "https://wasm.rip/files/granny/granny3.html",
      image: "Images/.png",
      icon: "fa-house",
      a: "#9c6a43",
      b: "#2b211b",
      category: "Horror",
      description: "",
      isNew: true
    },
    {
      name: "GTA 3",
      url: "https://wasm.rip/files/gta3/index.html",
      image: "Images/GTA5.png",
      icon: "fa-car",
      a: "#9c6a43",
      b: "#2b211b",
      category: "Action",
      description: "CupHead is a classic run-and-gun action game inspired by 1930s cartoons. Play as CupHead or Mugman as you explore strange worlds, battle challenging bosses, and collect powerful abilities. with hand-drawn animation, jazz music, and intense gameplay, every level is a unique adventure!",
      isTopRated: true
    },
    {
      name: "How To Fish ",
      url: "https://wasm.rip/files/HowToFish/HowToFish.html",
      image: "Images/.png",
      icon: "fa-fish",
      a: "#9c6a43",
      b: "#2b211b",
      category: "",
      description: "Get ready for a fishing adventure like no other! Explore mysterious islands, catch all kinds of fish, complete quests, and discover new areas. Earn rewards, collect rare catches, and see how far your fishing adventure can take you!",
      isTopRated: true
    },
    {
      name: "Inscryption",
      url: "https://wasm.rip/files/inscryption/index.html",
      image: "Images/.png",
      icon: "fa-",
      a: "#9c6a43",
      b: "#2b211b",
      category: "",
      description: "",
      isNew: true
    },
    {
      name: "Lethal",
      url: "https://wasm.rip/files/lethal/index.html",
      image: "Images/.png",
      icon: "fa-",
      a: "#9c6a43",
      b: "#2b211b",
      category: "",
      description: "",
      isNew: true
    },
    {
      name: "Miside",
      url: "https://wasm.rip/files/miside/miside.html",
      image: "Images/.png",
      icon: "fa-",
      a: "#9c6a43",
      b: "#2b211b",
      category: "",
      description: "",
      isNew: true
    },
    {
      name: "OneShot",
      url: "https://wasm.rip/files/oneshot-wme/index.html",
      image: "Images/.png",
      icon: "fa-",
      a: "#9c6a43",
      b: "#2b211b",
      category: "",
      description: "",
      isNew: true
    },
    {
      name: "Peak",
      url: "https://wasm.rip/files/peak/PEAK.html",
      image: "Images/.png",
      icon: "fa-mountain",
      a: "#9c6a43",
      b: "#2b211b",
      category: "",
      description: "",
      isTopRated: true
    },
    {
      name: "Stardew Valley",
      url: "https://wasm.rip/files/stardewvalley/index.html",
      image: "Images/.png",
      icon: "fa-mountain",
      a: "#9c6a43",
      b: "#2b211b",
      category: "",
      description: "",
      isNew: true
    },
    {
        name: "Super Mario 64",
        url: "",
        image: "Images/.png",
        icon: "fa-",
        a: "#9c6a43",
        b: "#2b211b",
        category: "",
        description: "",
        isRom: true
      },
      {
        name: "Donkey",
        url: "",
        image: "Images/.png",
        icon: "fa-",
        a: "#9c6a43",
        b: "#2b211b",
        category: "",
        description: "",
        isRom: true
      },
      {
        name: "Earth Bound",
        url: "",
        image: "Images/.png",
        icon: "fa-",
        a: "#9c6a43",
        b: "#2b211b",
        category: "",
        description: "",
        isRom: true
      },
      {
        name: "ffiii",
        url: "",
        image: "Images/.png",
        icon: "fa-",
        a: "#9c6a43",
        b: "#2b211b",
        category: "",
        description: "",
        isRom: true
      },
      {
        name: "Pokemon Saphire",
        url: "",
        image: "Images/.png",
        icon: "fa-",
        a: "#9c6a43",
        b: "#2b211b",
        category: "",
        description: "",
        isRom: true
      },
      {
        name: "prboom",
        url: "",
        image: "Images/.png",
        icon: "fa-",
        a: "#9c6a43",
        b: "#2b211b",
        category: "",
        description: "",
        isRom: true
      },
  ];
  
  const featuredSlides = [
    {
      name: "Roblox",
      video: "RobloxPage.mp4",
      description: "Explore millions of player-created experiences in Roblox! Play exciting games, discover unique worlds, customize your avatar, and connect with friends. From adventures and simulators to obbys and competitive challenges, there's always something new to play!"
    },
    {
      name: "Minecraft 26.2",
      video: "Minecraft.mp4",
      description: "Explore a massive block-based world in Minecraft! Gather Resources, craft tools, build incredible structures, and survive against dangerous mobs. Create your own adventures and let your imagination run wild!"
    },
    {
      name: "GTA 5",
      video: "GTA5.mp4",
      description: "Experience the action-packed open world of Los Santos in GTA 5! Explore a massive city, drive incredible vehicles, complete missions, and experience an exciting criminal adventure. Switch between three unique characters and discover everything this vast open world has to offer."
    },
    {
      name: "Hollow Knigh",
      video: "GTA5.mp4",
      description: "Explore the mysterious underground kingdom of Hallowwnest in Hollow Knight! Battle dangerous creatures, discorver hidden areas, unlock powerful abilities, and uncover the secrets of a forgotten kingdom. Embark on an atmospheric adventure filled with challenging enemies, epic bosses, and exciting exploration."
    },
    {
      name: "CupHead",
      video: "GTA5.mp4",
      description: "CupHead is a classic run-and-gun action game inspired by 1930s cartoons. Play as CupHead or Mugman as you explore strange worlds, battle challenging bosses, and collect powerful abilities. with hand-drawn animation, jazz music, and intense gameplay, every level is a unique adventure!"
    },
    {
      name: "Skate 3",
      video: "GTA5.mp4",
      description: "Hit the streets in Skate 3 and become a skateboarding legend! Explore an open world, perform incredible tricks, land massive combos, and challenge yourself to master every obstacle. Grab your board and show off your skills!"
    },
    {
      name: "Among Us",
      video: "GTA5.mp4",
      description: "Join your crewmates aboard a spaceship and work together to complete tasks while trying to uncover the imposters hiding among you. Use teamwork, deception, and clever strategies to survive, expose the imposters, and win the game!"
    },
    {
      name: "How To Fish",
      video: "GTA5.mp4",
      description: "Get ready for a fishing adventure like no other! Explore mysterious islands, catch all kinds of fish, complete quests, and discover new areas. Earn rewards, collect rare catches, and see how far your fishing adventure can take you!"
    },
    {
      name: "Peak",
      video: "GTA5.mp4",
      description: "The ultimate climbing challenge awaits! Tam up with your friends and make your way up a dangerous mountain filled with obstacles, hidden paths, and unexpected challenges. Work together, manage your stamina, and reach the summit. Can you make it to the top?"
    }
  ];
  
  const $ = id => document.getElementById(id);
  
  const libraryPage = $("libraryPage");
  const playerPage = $("playerPage");
  const grid = $("gameGrid");
  const search = $("search");
  const frame = $("gameFrame");
  const loadingCover = $("loadingCover");
  const loadingTitle = $("loadingTitle");
  const loadingText = $("loadingText");
  const loadingSpinner = $("loadingSpinner");
  const retryButton = $("retryButton");
  const playerStatus = $("playerStatus");
  const statusDot = $("statusDot");
  
  const featuredBanner = $("featuredBanner");
  const featuredContent = $("featuredContent");
  const featuredTitle = $("featuredTitle");
  const featuredDescription = $("featuredDescription");
  const featuredPlayButton = $("featuredPlayButton");
  const featuredBrowseButton = $("featuredBrowseButton");
  const featuredDots = $("featuredDots");
  const featuredPauseButton = $("featuredPauseButton");
  const featuredPreviousButton = $("featuredPreviousButton");
  const featuredNextButton = $("featuredNextButton");
  
  const categoriesNav = $("categoriesNav");
  const categoryPanel = $("categoryPanel");
  const categoryButtons = $("categoryButtons");
  const allCategoryButton = $("allCategoryButton");
  
  const featuredVideos = [
    $("featuredVideoOne"),
    $("featuredVideoTwo")
  ];
  
  let selectedGame = null;
  let favorites = readFavorites();
  let favoritesOnly = false;
  let selectedCategory = "All";
  
  let loadTimer = null;
  let loadToken = 0;

  let fullscreenEscapeCount = 0;
  let fullscreenEscapeTimer = null;
  
  let featuredIndex = 0;
  let activeFeaturedVideo = 0;
  let featuredTimer = null;
  let featuredPaused = false;
  let featuredSwitching = false;
  
  let randomPickerGame = null;
  let randomPickerTimer = null;
  let randomPickerFrame = null;
  let randomPickerAnimationToken = 0;
  let stopRandomReelSound = () => {};
  
  function readFavorites() {
    try {
      const stored = JSON.parse(
        localStorage.getItem("gameHubFavorites") || "[]"
      );
      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  }
  
  function saveFavorites() {
    try {
      localStorage.setItem(
        "gameHubFavorites",
        JSON.stringify(favorites)
      );
    } catch (error) {
      console.warn("Favorites could not be saved in this browser.", error);
    }
  }
  
  function isFavorite(game) {
    return favorites.includes(game.name);
  }
  
  function toggleFavorite(game) {
    if (isFavorite(game)) {
      favorites = favorites.filter(name => name !== game.name);
    } else {
      favorites.push(game.name);
    }
  
    saveFavorites();
    renderGames();
    updatePlayerFavorite();
  }
  
  function getCategories() {
    return [
      ...new Set(games.map(game => game.category).filter(Boolean))
    ].sort((a, b) =>
      a.localeCompare(b, undefined, {
        sensitivity: "base",
        numeric: true
      })
    );
  }
  
  function renderCategoryButtons() {
    categoryButtons.replaceChildren();
  
    getCategories().forEach(category => {
      const button = document.createElement("button");
  
      button.type = "button";
      button.className =
        "category-button" +
        (selectedCategory.toLowerCase() === category.toLowerCase()
          ? " active"
          : "");
  
      button.dataset.category = category;
      button.innerHTML = `<i class="fa-solid fa-tag"></i> ${category}`;
  
      button.addEventListener("click", () => {
        selectedCategory = category;
        renderCategoryButtons();
        renderGames();
      });
  
      categoryButtons.appendChild(button);
    });

    const romButton =
    document.createeElement("button");

    romButton.type = "button";
    romButton.className =
    "category-button" +
    (selectedCategory === "ROM" ? "active" : "");

    romButton.innerHTML = `<i class="fa-solid fa-pamepad"></i> ROM`;

    romButton.addEventListener("click", () => {
        selectCactegory = "ROM";
        renderCactegoryButtons();
        renderGames();
    });

    catagoryButton.appendChild(romButton);
  
    allCategoryButton.classList.toggle("active", selectedCategory === "All");
  }
  
  function toggleCategoryPanel() {
    const isHidden = categoryPanel.hidden;
  
    categoryPanel.hidden = !isHidden;
    categoriesNav.classList.toggle("active", isHidden);
  
    if (isHidden) renderCategoryButtons();
  }
  
  function createCoverImage(game, className = "cover-image") {
    if (!game.image) return null;
  
    const image = document.createElement("img");
    image.className = className;
    image.src = game.image;
    image.alt = `${game.name} cover`;
    image.loading = "lazy";
    image.decoding = "async";
    image.addEventListener("error", () => image.remove());
  
    return image;
  }
  
  function makeCard(game) {
    const card = document.createElement("article");
    card.className = "game-card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Play ${game.name}`);
  
    const cover = document.createElement("div");
    cover.className = "cover";
    cover.style.setProperty("--cover-a", game.a || "#444");
    cover.style.setProperty("--cover-b", game.b || "#171b17");
  
    const image = createCoverImage(game);
    if (image) cover.appendChild(image);
  
    const badgeText = game.isTopRated
      ? "TOP RATED"
      : game.isUpdated
        ? "UPDATED"
        : game.isNew
          ? "NEW"
          : "";
  
    if (badgeText) {
      const badge = document.createElement("span");
      badge.className = "new-badge";
      badge.textContent = badgeText;
      badge.setAttribute("aria-label", `${badgeText} game`);
      cover.appendChild(badge);
    }
  
    const symbol = document.createElement("i");
    symbol.className = `cover-symbol fa-solid ${game.icon}`;
    symbol.setAttribute("aria-hidden", "true");
  
    const coverLabel = document.createElement("span");
    coverLabel.className = "cover-label";
    coverLabel.textContent = game.category || "";
  
    cover.append(symbol, coverLabel);
  
    const favorite = document.createElement("button");
    favorite.type = "button";
    favorite.className =
      `favorite${isFavorite(game) ? " active" : ""}`;
    favorite.setAttribute(
      "aria-label",
      `${isFavorite(game) ? "Remove" : "Add"} ${game.name} favorite`
    );
    favorite.setAttribute("aria-pressed", String(isFavorite(game)));
  
    const heart = document.createElement("i");
    heart.className =
      `${isFavorite(game) ? "fa-solid" : "fa-regular"} fa-heart`;
    favorite.appendChild(heart);
  
    favorite.addEventListener("click", event => {
      event.stopPropagation();
      toggleFavorite(game);
    });
  
    const info = document.createElement("div");
    info.className = "card-info";
  
    const title = document.createElement("h3");
    title.className = "card-title";
    title.textContent = game.name;
  
    const meta = document.createElement("div");
    meta.className = "card-meta";
    meta.textContent = game.category || "Game";
  
    info.append(title, meta);
    card.append(cover, favorite, info);
  
    card.addEventListener("click", () => openGame(game));
    card.addEventListener("keydown", event => {
      if (
        event.target === card &&
        (event.key === "Enter" || event.key === " ")
      ) {
        event.preventDefault();
        openGame(game);
      }
    });
  
    return card;
  }
  
  function makeRandomGameCard() {
    const card = document.createElement("article");
    card.className = "game-card random-game-card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", "Choose a random game");
  
    const cover = document.createElement("div");
    cover.className = "cover";
  
    const icon = document.createElement("i");
    icon.className = "cover-symbol fa-solid fa-shuffle";
    icon.setAttribute("aria-hidden", "true");
  
    const label = document.createElement("span");
    label.className = "cover-label";
    label.textContent = "LET FATE DECIDE";
  
    cover.append(icon, label);
  
    const info = document.createElement("div");
    info.className = "card-info";
  
    const title = document.createElement("h3");
    title.className = "card-title";
    title.textContent = "Random Game";
  
    const meta = document.createElement("div");
    meta.className = "card-meta";
    meta.textContent = "Pick something to play";
  
    info.append(title, meta);
    card.append(cover, info);
  
    card.addEventListener("click", openRandomPicker);
    card.addEventListener("keydown", event => {
      if (
        event.target === card &&
        (event.key === "Enter" || event.key === " ")
      ) {
        event.preventDefault();
        openRandomPicker();
      }
    });
  
    return card;
  }
  
  function renderGames() {
    const term = search.value.trim().toLowerCase();
  
    const visible = games.filter(game => {
      const matchesCategory =
        selectedCategory === "All" ||
        (selectedCategory === "ROM"
        ? game.isRom === true
        :(game.category || "").toLowerCase() ===
          selectedCategory.toLowerCase());
  
      const searchableText =
        [game.name, game.category, game.description]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
  
      const matchesSearch = searchableText.includes(term);
      const matchesFavorite = !favoritesOnly || isFavorite(game);
  
      return matchesSearch && matchesFavorite && matchesCategory;
    });
  
    grid.replaceChildren();
  
    $("resultCount").textContent =
      `${visible.length} game${visible.length === 1 ? "" : "s"}`;
    $("headerCount").textContent = `${games.length} games`;
  
    $("gridTitle").textContent = favoritesOnly
      ? "Your favorites"
      : selectedCategory === "All"
        ? "All games"
        : selectedCategory;
  
    if (!visible.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
  
      const icon = document.createElement("i");
      icon.className = "fa-solid fa-magnifying-glass";
  
      const title = document.createElement("strong");
      title.textContent = favoritesOnly
        ? "No favorites yet"
        : "No games found";
  
      const description = document.createElement("span");
      description.textContent = favoritesOnly
        ? "Tap the heart on any game to save it here."
        : "Try a different search or category.";
  
      empty.append(icon, title, description);
      grid.appendChild(empty);
      return;
    }
  
    if (!favoritesOnly && selectedCategory === "All" && !term) {
      grid.appendChild(makeRandomGameCard());
    }
  
    visible
      .slice()
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, {
          numeric: true,
          sensitivity: "base"
        })
      )
      .forEach(game => grid.appendChild(makeCard(game)));
  }
  
  /* Horizontal slot-machine reel */
  
  function buildHorizontalReel() {
    const stage = $("randomStage");
    if (!stage) return null;
  
    stage.replaceChildren();
  
    const reelWindow = document.createElement("div");
    reelWindow.className = "random-reel-window";
    reelWindow.id = "randomReelWindow";
  
    const track = document.createElement("div");
    track.className = "random-reel-track";
    track.id = "randomReelTrack";
  
    // No visible center box: the middle card is identified by brightness and size.
    reelWindow.appendChild(track);
    stage.appendChild(reelWindow);
  
    return { reelWindow, track };
  }
  
  function createReelIcon(game) {
    const icon = document.createElement("i");
    icon.className = "random-reel-icon fa-solid " + game.icon;
    icon.setAttribute("aria-hidden", "true");
    return icon;
  }
  
  function createReelItem(game) {
    const card = document.createElement("article");
    card.className = "random-reel-item";
    card.dataset.gameName = game.name;
  
    const cover = document.createElement("div");
    cover.className = "random-reel-cover";
    cover.style.setProperty("--cover-a", game.a || "#444");
    cover.style.setProperty("--cover-b", game.b || "#171b17");
  
    if (game.image) {
      const image = document.createElement("img");
      image.src = game.image;
      image.alt = game.name + " cover";
      image.loading = "eager";
      image.addEventListener("error", () => {
        image.remove();
        if (!cover.querySelector(".random-reel-icon")) {
          cover.appendChild(createReelIcon(game));
        }
      });
      cover.appendChild(image);
    } else {
      cover.appendChild(createReelIcon(game));
    }
  
    const info = document.createElement("div");
    info.className = "random-reel-info";
  
    const name = document.createElement("span");
    name.className = "random-reel-name";
    name.textContent = game.name;
  
    const category = document.createElement("span");
    category.className = "random-reel-category";
    category.textContent = game.category || "Game";
  
    info.append(name, category);
    card.append(cover, info);
  
    return card;
  }
  
  function updateReelCardAppearance(track, reelWindow) {
    const windowRect = reelWindow.getBoundingClientRect();
    const centerX = windowRect.left + windowRect.width / 2;
    const fadeDistance = Math.max(windowRect.width * 0.48, 1);
  
    track.querySelectorAll(".random-reel-item").forEach(card => {
      const rect = card.getBoundingClientRect();
      const cardCenter = rect.left + rect.width / 2;
      const distance = Math.abs(centerX - cardCenter);
      const amount = Math.min(distance / fadeDistance, 1);
  
      const scale = 1 - amount * 0.28;
      const opacity = 1 - amount * 0.8;
      const brightness = 1 - amount * 0.55;
      const centered = distance < rect.width * 0.12;
  
      card.style.setProperty("--reel-scale", scale.toFixed(3));
      card.style.setProperty("--reel-opacity", opacity.toFixed(3));
      card.style.setProperty("--reel-brightness", brightness.toFixed(3));
      card.classList.toggle("is-center", centered);
    });
  }
  
  function burstRandomParticles() {
    const particles = $("randomParticles");
    if (!particles) return;
  
    particles.replaceChildren();
  
    for (let index = 0; index < 34; index++) {
      const particle = document.createElement("span");
      particle.className = "random-particle";
  
      const angle = Math.random() * Math.PI * 2;
      const distance = 90 + Math.random() * 210;
  
      particle.style.setProperty(
        "--particle-x",
        `${Math.cos(angle) * distance}px`
      );
      particle.style.setProperty(
        "--particle-y",
        `${Math.sin(angle) * distance}px`
      );
      particle.style.animationDelay = `${Math.random() * 120}ms`;
  
      particles.appendChild(particle);
    }
  
    setTimeout(() => particles.replaceChildren(), 1100);
  }
  
  function stopRandomReelAnimation() {
    clearTimeout(randomPickerTimer);
    randomPickerTimer = null;
  
    if (randomPickerFrame !== null) {
      cancelAnimationFrame(randomPickerFrame);
      randomPickerFrame = null;
    }
  
    randomPickerAnimationToken++;
  }
  
  function playReelSound(duration = 6200) {
const AudioContextClass =
window.AudioContext || window.webkitAudioContext;
if (!AudioContextClass) return () => {};
const audio = new AudioContextClass();
const startTime = audio.currentTime;
let stopped = false;
let tick = 0;
if (audio.state === "suspended") {
audio.resume().catch(() => {});
}
function scheduleTick() {
if (stopped) return;
const elapsed = audio.currentTime - startTime;
if (elapsed >= duration / 1000) return;

// Ticks start fast, then gradually slow down like a slot-machine reel.
const progress = elapsed / (duration / 1000);
const delay = 0.035 + progress * progress * 0.19;
const now = audio.currentTime;

const oscillator = audio.createOscillator();
const gain = audio.createGain();

oscillator.type = "square";
oscillator.frequency.value = 700 + Math.random() * 500;
gain.gain.setValueAtTime(0.0001, now);
gain.gain.exponentialRampToValueAtTime(0.045, now + 0.004);
gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

oscillator.connect(gain);
gain.connect(audio.destination);
oscillator.start(now);
oscillator.stop(now + 0.03);

tick++;
randomPickerTimer = setTimeout(scheduleTick, delay * 1000);

}
scheduleTick();
return function stopReelSound() {
stopped = true;
clearTimeout(randomPickerTimer);
audio.close().catch(() => {});
};
}

  function openRandomPicker() {
    const eligibleGames = games.filter(game => game.url);
    if (!eligibleGames.length) return;
  
    stopRandomReelAnimation();
    stopRandomReelSound();
    stopRandomReelSound = playReelSound(6200);

    randomPickerGame = null;
  
    const picker = $("randomPicker");
    const help = $("randomPickerHelp");
    const againButton = $("randomAgainButton");
    const playButton = $("randomPlayButton");
  
    if (!picker || !help || !againButton || !playButton) {
      console.error("The random picker is missing required HTML elements.");
      return;
    }
  
    const reel = buildHorizontalReel();
    if (!reel) {
      console.error("The random picker is missing #randomStage.");
      return;
    }
  
    const { reelWindow, track } = reel;
    const isMobile = window.matchMedia("(max-width: 600px)").matches;
    const cardWidth = isMobile ? 145 : 190;
    const itemHeight = isMobile ? 238 : 286;
    const token = randomPickerAnimationToken;
  
    reelWindow.style.setProperty("--reel-card-width", `${cardWidth}px`);
    track.style.setProperty("--reel-card-width", `${cardWidth}px`);
  
    picker.hidden = false;
    requestAnimationFrame(() => picker.classList.add("active"));
  
    help.textContent = "Spinning for a random game…";
    againButton.hidden = true;
    playButton.hidden = true;
    $("randomParticles")?.replaceChildren();
  
    const rounds = 10;
    const reelGames = [];
  
    for (let round = 0; round < rounds; round++) {
      reelGames.push(...eligibleGames);
    }
  
    const winnerIndex = Math.floor(Math.random() * eligibleGames.length);
    const winnerPosition =
      (rounds - 1) * eligibleGames.length + winnerIndex;
  
    track.replaceChildren(...reelGames.map(createReelItem));
    track.style.transition = "none";
    track.style.transform = "translateX(0)";
  
    requestAnimationFrame(() => {
      if (token !== randomPickerAnimationToken) return;
  
      // The first card's left edge is the track's origin.
      const centerOffset =
        (reelWindow.clientWidth - cardWidth) / 2;
      const finalOffset =
        winnerPosition * cardWidth - centerOffset;
  
      track.style.transition =
        "transform 6.2s cubic-bezier(.12,.72,.12,1)";
      track.style.transform = `translateX(-${finalOffset}px)`;
  
      const updateAppearance = () => {
        if (token !== randomPickerAnimationToken) return;
  
        updateReelCardAppearance(track, reelWindow);
        randomPickerFrame = requestAnimationFrame(updateAppearance);
      };
  
      randomPickerFrame = requestAnimationFrame(updateAppearance);
  
      randomPickerTimer = setTimeout(() => {
        if (token !== randomPickerAnimationToken) return;
  
        if (randomPickerFrame !== null) {
          cancelAnimationFrame(randomPickerFrame);
          randomPickerFrame = null;
        }
  
        randomPickerGame = eligibleGames[winnerIndex];
  
        // Ensure the selected item lands exactly in the center.
        track.style.transition = "transform .16s ease-out";
        track.style.transform = `translateX(-${finalOffset}px)`;
  
        help.textContent = `${randomPickerGame.name} is the winner!`;
        againButton.hidden = false;
        playButton.hidden = false;
  
        requestAnimationFrame(() => {
          updateReelCardAppearance(track, reelWindow);
          burstRandomParticles();
  
          const content =
            document.querySelector(".random-picker-content");
          if (content) {
            content.classList.remove("popping");
            void content.offsetWidth;
            content.classList.add("popping");
          }
        });
      }, 6350);
    });
  }
  
  function closeRandomPicker() {
    stopRandomReelAnimation();
    stopRandomReelSound();
    stopRandomReelSound = () => {};

  
    const picker = $("randomPicker");
    if (!picker) return;
  
    picker.classList.remove("active");
  
    setTimeout(() => {
      picker.hidden = true;
      $("randomParticles")?.replaceChildren();
    }, 350);
  }
  
  function setLibraryMode(mode) {
    favoritesOnly = mode === "favorites";
  
    $("homeNav").classList.toggle("active", !favoritesOnly);
    $("favoritesNav").classList.toggle("active", favoritesOnly);
    $("allFilter").classList.toggle("active", !favoritesOnly);
    $("favoritesFilter").classList.toggle("active", favoritesOnly);
  
    $("pageTitle").textContent =
      favoritesOnly ? "Your Favorites" : "Game Library";
    $("pageSubtitle").textContent = favoritesOnly
      ? "Your saved games, all in one place."
      : "All your games, together in one place.";
  
    renderGames();
  }
  
  function setStatus(message, type = "") {
    playerStatus.textContent = message;
    playerStatus.className = type;
  
    statusDot.style.background =
      type === "error"
        ? "#ff626e"
        : type === "waiting"
          ? "#e7c75b"
          : "var(--green)";
  }
  
  function showLoading() {
    loadingCover.classList.remove("hidden");
    loadingSpinner.hidden = false;
    loadingTitle.textContent = "Loading game";
    loadingText.textContent =
      "Please wait while the game page loads inside Game Hub.";
    retryButton.hidden = true;
    setStatus("Loading game...");
  }
  
  function showPossibleBlock() {
    loadingSpinner.hidden = true;
    loadingTitle.textContent = "Game may not be embeddable";
    loadingText.textContent =
      "This site may block embedded play, or it may be taking too long to respond. Try reloading. Some sites cannot run inside an iframe.";
    retryButton.hidden = false;
    setStatus("Unable to confirm gameplay", "waiting");
  }
  
  function updateSidebarCover(game) {
    const sidebarCover = $("sidebarCover");
    sidebarCover.replaceChildren();
  
    sidebarCover.style.setProperty("--cover-a", game.a);
    sidebarCover.style.setProperty("--cover-b", game.b);
  
    const image = createCoverImage(game, "sidebar-cover-image");
    if (image) sidebarCover.appendChild(image);
  
    const icon = document.createElement("i");
    icon.className = `fa-solid ${game.icon}`;
    icon.setAttribute("aria-hidden", "true");
    sidebarCover.appendChild(icon);
  }
  
  function openGame(game) {
    selectedGame = game;
  
    libraryPage.classList.add("hidden");
    playerPage.classList.add("active");
    featuredBanner.style.display = "none";
  
    $("playerTitle").textContent = game.name;
    $("sidebarTitle").textContent = game.name;
    $("sidebarDescription").textContent = game.description;
    $("gameInfo").textContent =
      `${game.category || "Game"} • This game is displayed inside the Game Hub player.`;
  
    updateSidebarCover(game);
    document.title = `${game.name} - Game Hub`;
    updatePlayerFavorite();
    loadGame();
  
    window.scrollTo({ top: 0, behavior: "auto" });
  }
  
  function loadGame() {
    if (!selectedGame) return;
  
    clearTimeout(loadTimer);
    const thisLoad = ++loadToken;
  
    showLoading();
    frame.src = "about:blank";
  
    requestAnimationFrame(() => {
      if (thisLoad !== loadToken || !selectedGame) return;
      frame.src = selectedGame.url;
    });
  
    loadTimer = setTimeout(() => {
      if (
        thisLoad === loadToken &&
        !loadingCover.classList.contains("hidden")
      ) {
        showPossibleBlock();
      }
    }, 12000);
  }
  
  frame.addEventListener("load", () => {
    if (!selectedGame) return;
  
    clearTimeout(loadTimer);
    loadingCover.classList.add("hidden");
    setStatus("Game page responded — gameplay not verified", "waiting");
  });
  
  function updatePlayerFavorite() {
    if (!selectedGame) return;
  
    const favorite = isFavorite(selectedGame);
  
    $("playerFavorite").innerHTML =
      `<i class="${favorite ? "fa-solid" : "fa-regular"} fa-heart"></i> ` +
      `${favorite ? "Favorited" : "Favorite"}`;
  
    $("playerFavorite").setAttribute("aria-pressed", String(favorite));
  }
  
  function backToLibrary() {
    clearTimeout(loadTimer);
  
    loadToken++;
    selectedGame = null;
    frame.src = "about:blank";
  
    playerPage.classList.remove("active");
    libraryPage.classList.remove("hidden");
    featuredBanner.style.display = "";
  
    document.title = "Game Hub";
    renderGames();
    startFeaturedSlideshow();
  
    window.scrollTo({ top: 0, behavior: "auto" });
  }
  
  async function toggleFullscreen() {
    const target = $("playerShell");
  
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (target.requestFullscreen) {
        await target.requestFullscreen();
      } else {
        setStatus("Fullscreen is not supported by this browser", "waiting");
      }
    } catch {
      setStatus("Fullscreen could not be activated", "error");
    }
  }
  
  /* Featured video slideshow */
  
  function createFeaturedDots() {
    featuredDots.replaceChildren();
  
    featuredSlides.forEach((slide, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "featured-dot";
      dot.setAttribute("aria-label", `Show ${slide.name} featured slide`);
      dot.addEventListener("click", () => showFeaturedSlide(index));
      featuredDots.appendChild(dot);
    });
  }
  
  function updateFeaturedDots() {
    featuredDots.querySelectorAll(".featured-dot").forEach((dot, index) => {
      dot.classList.toggle("active", index === featuredIndex);
    });
  }
  
  function updateFeaturedText() {
    const slide = featuredSlides[featuredIndex];
  
    featuredContent.style.opacity = "0";
    featuredContent.style.transform = "translateY(10px)";
  
    setTimeout(() => {
      featuredTitle.textContent = slide.name;
      featuredDescription.textContent = slide.description;
      featuredPlayButton.innerHTML =
        `<i class="fa-solid fa-play"></i><span>Play ${slide.name}</span>`;
  
      featuredContent.style.opacity = "1";
      featuredContent.style.transform = "translateY(0)";
    }, 180);
  }
  
  function updateFeaturedPauseButton() {
    featuredPauseButton.innerHTML =
      `<i class="fa-solid ${featuredPaused ? "fa-play" : "fa-pause"}"></i>`;
  
    featuredPauseButton.setAttribute(
      "aria-label",
      featuredPaused ? "Play featured slideshow" : "Pause featured slideshow"
    );
    featuredPauseButton.setAttribute("aria-pressed", String(featuredPaused));
  }
  
  function scheduleFeaturedSlide() {
    clearTimeout(featuredTimer);
  
    if (
      !featuredPaused &&
      featuredSlides.length > 1 &&
      !playerPage.classList.contains("active")
    ) {
      featuredTimer = setTimeout(() => {
        showFeaturedSlide((featuredIndex + 1) % featuredSlides.length);
      }, 7000);
    }
  }
  
  function showFeaturedSlide(index) {
    if (
      featuredSlides.length <= 1 ||
      index === featuredIndex ||
      featuredSwitching
    ) {
      return;
    }
  
    featuredSwitching = true;
    clearTimeout(featuredTimer);
  
    const nextVideoIndex = 1 - activeFeaturedVideo;
    const nextVideo = featuredVideos[nextVideoIndex];
    const previousVideo = featuredVideos[activeFeaturedVideo];
  
    nextVideo.classList.remove("active");
    nextVideo.src = featuredSlides[index].video;
    nextVideo.load();
  
    const finishSwitch = () => {
      nextVideo.classList.add("active");
      previousVideo.classList.remove("active");
  
      featuredIndex = index;
      activeFeaturedVideo = nextVideoIndex;
  
      updateFeaturedText();
      updateFeaturedDots();
  
      setTimeout(() => {
        previousVideo.pause();
        previousVideo.removeAttribute("src");
        previousVideo.load();
  
        featuredSwitching = false;
        scheduleFeaturedSlide();
      }, 750);
    };
  
    nextVideo.play().then(finishSwitch).catch(finishSwitch);
  }
  
  function startFeaturedSlideshow() {
    if (!featuredSlides.length) {
      featuredTitle.textContent = "No featured games";
      featuredDescription.textContent =
        "Add videos to display featured games.";
      return;
    }
  
    createFeaturedDots();
    updateFeaturedText();
    updateFeaturedDots();
    updateFeaturedPauseButton();
  
    const activeVideo = featuredVideos[activeFeaturedVideo];
  
    if (!activeVideo.src) {
      activeVideo.src = featuredSlides[featuredIndex].video;
      activeVideo.load();
    }
  
    activeVideo.play().catch(() => {});
    scheduleFeaturedSlide();
  }
  
  function toggleFeaturedPause() {
    featuredPaused = !featuredPaused;
  
    if (featuredPaused) {
      clearTimeout(featuredTimer);
      featuredVideos[activeFeaturedVideo].pause();
    } else {
      featuredVideos[activeFeaturedVideo].play().catch(() => {});
      scheduleFeaturedSlide();
    }
  
    updateFeaturedPauseButton();
  }
  
  function getFeaturedIndex(direction) {
    return (
      (featuredIndex + direction + featuredSlides.length) %
      featuredSlides.length
    );
  }
  
  /* Featured controls */
  
  featuredPlayButton.addEventListener("click", () => {
const featuredName = featuredSlides[featuredIndex].name;
const game = games.find(item =>
item.name.trim() === featuredName.trim()
);
if (game) openGame(game);
});
  
  featuredBrowseButton.addEventListener("click", () => {
    libraryPage.scrollIntoView({ behavior: "smooth" });
  });
  
  featuredPauseButton.addEventListener("click", toggleFeaturedPause);
  
  featuredPreviousButton.addEventListener("click", () => {
    showFeaturedSlide(getFeaturedIndex(-1));
  });
  
  featuredNextButton.addEventListener("click", () => {
    showFeaturedSlide(getFeaturedIndex(1));
  });
  
  featuredBanner.addEventListener("mouseenter", () => {
    if (!featuredPaused) clearTimeout(featuredTimer);
  });
  
  featuredBanner.addEventListener("mouseleave", () => {
    if (!featuredPaused) scheduleFeaturedSlide();
  });
  
  /* Main controls */
  
  categoriesNav.addEventListener("click", toggleCategoryPanel);
  
  allCategoryButton.addEventListener("click", () => {
    selectedCategory = "All";
    renderCategoryButtons();
    renderGames();
  });
  
  search.addEventListener("input", renderGames);
  
  $("homeNav").addEventListener("click", () => {
    backToLibrary();
    setLibraryMode("all");
  });
  
  $("favoritesNav").addEventListener("click", () => {
    backToLibrary();
    setLibraryMode("favorites");
  });
  
  $("allFilter").addEventListener("click", () => setLibraryMode("all"));
  $("favoritesFilter").addEventListener("click", () => setLibraryMode("favorites"));
  
  $("backButton").addEventListener("click", backToLibrary);
  $("backToLibraryButton").addEventListener("click", backToLibrary);
  $("sidebarBack").addEventListener("click", backToLibrary);
  
  $("reloadButton").addEventListener("click", loadGame);
  $("reloadGameButton").addEventListener("click", loadGame);
  $("sidebarReload").addEventListener("click", loadGame);
  $("retryButton").addEventListener("click", loadGame);
  
  $("fullscreenButton").addEventListener("click", toggleFullscreen);
  $("fullscreenGameButton").addEventListener("click", toggleFullscreen);
  
  $("playerFavorite").addEventListener("click", () => {
    if (selectedGame) toggleFavorite(selectedGame);
  });
  
  /* Random Game picker */
  
  $("randomPickerClose").addEventListener("click", closeRandomPicker);
  $("randomAgainButton").addEventListener("click", openRandomPicker);
  
  $("randomPlayButton").addEventListener("click", () => {
    if (!randomPickerGame) return;
  
    const game = randomPickerGame;
    closeRandomPicker();
    openGame(game);
  });
  
  $("randomPicker").addEventListener("click", event => {
    if (event.target === $("randomPicker")) {
      closeRandomPicker();
    }
  });
  
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !$("randomPicker").hidden) {
      closeRandomPicker();
    }
  });

  $("fullscreenExitButton").addEventListener("click", async () => {
if (document.fullscreenElement) {
await document.exitFullscreen();
}
});
document.addEventListener("keydown", event => {
if (event.key !== "Escape" || !document.fullscreenElement) return;
fullscreenEscapeCount++;
clearTimeout(fullscreenEscapeTimer);
fullscreenEscapeTimer = setTimeout(() => {
fullscreenEscapeCount = 0;
}, 1200);
if (fullscreenEscapeCount >= 2) {
fullscreenEscapeCount = 0;
clearTimeout(fullscreenEscapeTimer);
document.exitFullscreen().catch(() => {});
}
});
  
  /* Keyboard controls */
  
  document.addEventListener("keydown", event => {
    if (
      event.key === "Escape" &&
      playerPage.classList.contains("active") &&
      !document.fullscreenElement
    ) {
      backToLibrary();
    }
  
    if (
      event.key === "ArrowLeft" &&
      !playerPage.classList.contains("active")
    ) {
      showFeaturedSlide(getFeaturedIndex(-1));
    }
  
    if (
      event.key === "ArrowRight" &&
      !playerPage.classList.contains("active")
    ) {
      showFeaturedSlide(getFeaturedIndex(1));
    }
  
    if (
      event.key === " " &&
      !playerPage.classList.contains("active") &&
      document.activeElement.tagName !== "INPUT"
    ) {
      event.preventDefault();
      toggleFeaturedPause();
    }
  });
  
  document.addEventListener("fullscreenchange", () => {
    const icon = $("fullscreenButton").querySelector("i");
    icon.className = document.fullscreenElement
      ? "fa-solid fa-compress"
      : "fa-solid fa-expand";
  });
  
  renderCategoryButtons();
  renderGames();
  startFeaturedSlideshow();
