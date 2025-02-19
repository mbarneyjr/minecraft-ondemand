export function dynmapConfig() {
  return {
    deftemplatesuffix: 'hires',
    storage: {
      type: 'filetree',
    },
    components: [
      {
        class: 'org.dynmap.ClientConfigurationComponent',
      },
      {
        class: 'org.dynmap.JsonFileClientUpdateComponent',
        writeinterval: 1,
        sendhealth: false,
        sendposition: false,
        allowwebchat: false,
        hidewebchatip: true,
        includehiddenplayers: false,
        'use-name-colors': false,
        'use-player-login-ip': false,
        'require-player-login-ip': false,
        'block-banned-player-chat': true,
        hideifshadow: 0,
        hideifundercover: 0,
        hideifsneaking: true,
        'webchat-requires-login': false,
        chatlengthlimit: 256,
        'hide-if-invisiblity-potion': true,
        hidenames: true,
      },
      {
        class: 'org.dynmap.ClientComponent',
        type: 'link',
      },
      {
        class: 'org.dynmap.ClientComponent',
        type: 'coord',
        label: 'Location',
        hidey: true,
        'show-mcr': false,
        'show-chunk': false,
      },
    ],
    'display-whitelist': false,
    renderinterval: 1,
    renderacceleratethreshold: 60,
    renderaccelerateinterval: 0.2,
    'tiles-rendered-at-once': 2,
    usenormalthreadpriority: true,
    saverestorepending: true,
    'save-pending-period': 900,
    zoomoutperiod: 30,
    'initial-zoomout-validate': true,
    tileupdatedelay: 30,
    enabletilehash: true,
    hideores: true,
    'better-grass': true,
    'smooth-lighting': true,
    'use-brightness-table': true,
    'block-alias': null,
    'image-format': 'jpg-q90',
    'use-generated-textures': true,
    'correct-water-lighting': true,
    'transparent-leaves': true,
    'ctm-support': true,
    'custom-colors-support': true,
    'skin-url': 'http://skins.minecraft.net/MinecraftSkins/%player%.png',
    'render-triggers': [
      'blockplaced',
      'blockbreak',
      'leavesdecay',
      'blockburn',
      'chunkgenerated',
      'blockformed',
      'blockfaded',
      'blockspread',
      'explosion',
      'structuregrow',
      'blockgrow',
    ],
    'webpage-title': 'mc.barney.dev',
    tilespath: 'web/tiles',
    webpath: 'web',
    'update-webpath-files': true,
    exportpath: 'export',
    importpath: 'import',
    'disable-webserver': true,
    'allow-symlinks': true,
    timesliceinterval: 0.0,
    maxchunkspertick: 200,
    progressloginterval: 100,
    parallelrendercnt: 4,
    updaterate: 600000,
    fullrenderplayerlimit: 0,
    updateplayerlimit: 0,
    'per-tick-time-limit': 50,
    'update-min-tps': 18.0,
    'fullrender-min-tps': 18.0,
    'zoomout-min-tps': 18.0,
    showplayerfacesinmenu: true,
    grayplayerswhenhidden: true,
    'player-sort-permission-nodes': ['bukkit.command.op'],
    defaultzoom: 7,
    defaultworld: 'world',
    defaultmap: 'surface',
    'persist-ids-by-ip': true,
    'cyrillic-support': false,
    'round-coordinates': true,
    msg: {
      maptypes: 'Map Types',
      players: 'Players',
      chatrequireslogin: 'Chat Requires Login',
      chatnotallowed: 'You are not permitted to send chat messages',
      hiddennamejoin: 'Player joined',
      hiddennamequit: 'Player quit',
    },
    url: null,
    'custom-commands': {
      'image-updates': {
        preupdatecommand: '',
        postupdatecommand: '',
      },
    },
    snapshotcachesize: 500,
    'soft-ref-cache': true,
    noPermissionMsg: "You don't have permission to use this command!",
    verbose: false,
    'dump-missing-blocks': false,
    hackAttemptBlurb: '(IaM5uchA1337Haxr-Ban Me!)',
  };
}

export function worldConfig() {
  return {
    worlds: [
      {
        name: 'world_nether',
        title: 'Nether',
        enabled: false,
      },
      {
        name: 'world_the_end',
        title: 'The End',
        enabled: false,
      },
      {
        name: 'world',
        title: 'World',
        enabled: true,
        sendposition: false,
        sendhealth: false,
        tileupdatedelay: 30,
        extrazoomout: 5,
        maps: [
          {
            class: 'org.dynmap.hdmap.HDMap',
            name: 'surface',
            title: 'Surface',
            prefix: 't',
            perspective: 'iso_SE_30_hires',
            shader: 'stdtexture',
            lighting: 'shadows',
            mapzoomin: 3,
          },
        ],
      },
    ],
  };
}
