// Author: Jarrett Locke
// Class: Computer Graphics
//
// Assignment: Create a simple game of solitaire using WebGL (AAAARRRRRGGHGHHHH)
//
// Process:
//      - Create gl object
//      - Initialize viewport, clear color, and program.
//      - Initialize vertex buffer and attribute.
//      - Initialize color buffer and attribute.
//      - do things.
//
// It's really sad when I can find more documentation on WebGL from MSDN
//      than the actual developers of WebGL. >:(
//
// NOTES:
//      WebGL, when rendering 2D, implements depth by saying that things drawn
//          most recently are on top.
//
//      To implement cards: we can imagine that the cards are ordered ace x 4,
//          two x 4, three x 4, etc. This allows us to see that card_index % 2
//          gives us the color (even = black, odd = red) and index / 4 gives us
//          the number (0 = ace, 1 = two, etc.)
//
//      Only allow cards to be placed on another face-up card. Do not allow for
//          putting cards on the stack to place them in the stack. Must place
//          cards on the last card in stack for them to combine into one stack.

var canvas;
var gl;

var vPosition;
var vColor;
var program;
var verticesBuffer;
var verticesColorBuffer;

var deck = []; // holds index for all cards.
var deck_pos = vec2( -0.98, 0.98 );

var colors = [
    vec4( 1.0, 0.0, 0.0, 1.0 ),
    vec4( 0.0, 1.0, 0.0, 1.0 ),
    vec4( 0.0, 0.0, 1.0, 1.0 ),
    vec4( 1.0, 1.0, 0.0, 1.0 ),
    vec4( 1.0, 0.0, 1.0, 1.0 ),
    vec4( 0.0, 1.0, 1.0, 1.0 )
];

var card_dim = {
    width: 0.15,
    height: 0.4,
    offset: 0.11
};

var cards = {
    cards_x: [], // holds x values for all cards
    cards_y: [],  // holds y values for all cards
    cards_col: [], // holds the colors for all cards
    render_index: [] // tells in which order each cards is rendered.
};

var card_info = {
    face_up: [],  // tells you which cards are face up in the stacks
    place_pos: [] // tells which positions are legal for placement.
};

var stack_info = {
    stacks: [ [], [], [], [], [], [], 
              [], [], [], [], [], [] ], // holds the index of cards in stacks.
    stack_pos: [] // holds positions of the stacks.
};

var render_info = {
    render_vertices_x: [], // holds the x position of cards being rendered
    render_vertices_y: [], // holds the y position of cards being rendered
    render_colors: [],    // holds the colors of all rendered cards.
};

var mouse = {
    drag: false,
    selected: false,
    selected_cards: []
}


var debug = {
    index: []
}

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT );

    // Push card positions to vertex shader buffer.
    gl.bindBuffer( gl.ARRAY_BUFFER, verticesBuffer );
    for ( var i = 0; i < render_info.render_vertices_x.length; ++i )
    {
        var tmp = [
            vec2( render_info.render_vertices_x[ i ], 
                  render_info.render_vertices_y[ i ] ),
            vec2( render_info.render_vertices_x[ i ] + card_dim.width, 
                  render_info.render_vertices_y[ i ] ),
            vec2( render_info.render_vertices_x[ i ], 
                  render_info.render_vertices_y[ i ] - card_dim.height ),
            vec2( render_info.render_vertices_x[ i ] + card_dim.width,
                  render_info.render_vertices_y[ i ] - card_dim.height ),
            vec2( render_info.render_vertices_x[ i ], 
                  render_info.render_vertices_y[ i ] - card_dim.height ),
            vec2( render_info.render_vertices_x[ i ] + card_dim.width, 
                  render_info.render_vertices_y[ i ] )
        ];
        gl.bufferSubData( gl.ARRAY_BUFFER, 48 * i, flatten( tmp ) );
    }

    gl.bindBuffer( gl.ARRAY_BUFFER, verticesColorBuffer );
    for ( var i = 0; i < render_info.render_colors.length; ++i )
    {
        var tmp = [
            render_info.render_colors[ i ],
            render_info.render_colors[ i ],
            render_info.render_colors[ i ],
            render_info.render_colors[ i ],
            render_info.render_colors[ i ],
            render_info.render_colors[ i ]
        ];
        gl.bufferSubData( gl.ARRAY_BUFFER, 96 * i, flatten( tmp ) );
    }

    gl.drawArrays( gl.TRIANGLES, 0, 312 );
}

function mouseDown( e )
{
    // Tell the program that the mouse is pressing down.
    mouse.drag = true;
    
    // Get current position of the mouse in terms of WebGL.
    var currX = 2 * e.clientX / canvas.width - 1;
    var currY = 2 * ( canvas.height - e.clientY ) / canvas.height - 1;

    // Determine what the mouse is clicking on. Narrow by y-coord.
    // currY > deck_pos[1] (y) means either deck or finished stacks.
    if ( currY > deck_pos[ 1 ] - card_dim.height )
    {

    }
    else // one of the main stacks
    {
        // find index of stack being clicked. -1 means no stack is clicked.
        var x_index = -1;

        for ( var i = 0; i < 7; ++i )
        {
            if ( currX >= stack_info.stack_pos[ i ][ 0 ] &&
                 currX <= stack_info.stack_pos[ i ][ 0 ] + card_dim.width )
            {
                x_index = i;
            }
        }

        // No stack clicked. Exit.
        if ( x_index == -1 )
        {
            return;
        }

        var stack = stack_info.stack_pos[ x_index ];

        // Find y-index of card being clicked. Only count it as selected if
        // the card is face-up
        var y_index = -1;
        for ( var i = 0; i < stack.length; ++i )
        {
            var diff = ( i == stack.length - 1 ) ? card_dim.height : offset;
            if ( card_info.face_up[ stack[ i ] ] &&
                 currY > cards.cards_y[ stack[ i ] ] - diff &&
                 currY <= cards.cards_y[ stack[ i ] ] )
            {
                var y_index = i;
            }
        }

        if ( y_index == -1 )
        {
            return;
        }

        var limit = stack_info.stacks[ x_index ].length;
        for ( var i = y_index; 
              i < limit; 
              ++i )
        {
            mouse.selected_cards.push( stack_info.stacks[ x_index ].pop() );
        }
    }
}

//NOTE: 0 - 6 are field stacks, 7 is draw deck, 8 - 11 are the finish stacks
function mouseUp( e )
{
    drag = false;

    // Get current position of the mouse in terms of WebGL.
    var currX = 2 * e.clientX / canvas.width - 1;
    var currY = 2 * ( canvas.height - e.clientY ) / canvas.height - 1;
}

function mouseMove( e )
{
    if ( !drag )
    {
        return;
    }

    newX = 2 * e.clientX / canvas.width - 1;
    newY = 2 * ( canvas.height - e.clientY ) / canvas.height - 1;

    for ( var i = 0; i < selectedCards.length; ++i )
    {
        cardVertices[ selectedCards[ i ] ][ 0 ] = newX - card_dim.width / 2;
        cardVertices[ selectedCards[ i ] ][ 1 ] = newY - ( card_dim.offset * i );
    }
}

// Init cards. 
// Generate a "deck" with the values 0 - 51 in random order.
// "deal" the cards in specified places ( the rows );
function init()
{
    // Init stuffs
    init_deck();
    init_cards();
    init_render();
    init_info();
}

function init_deck()
{
    deck = [ 0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 
            13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 
            26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 
            39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51 ];

    // Shuffle the deck - Modern Fisher-Yates Shuffle Algorithm O( n )
    //      unless Math.random() has a problem.
    // https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#The_modern_algorithm
    for ( var i = 51; i > 0; --i )
    {
        var index = Math.floor( Math.random() * i );
        var tmp = deck[ i ];
        deck[ i ] = deck[ index ];
        deck[ index ] = tmp;
    }

    // Initalize stacks. 7 stacks with 1-2-3-4-5-6-7 cards.
    for ( var i = 0; i < 7; ++i )
    {
        for ( var k = 0; k < i + 1; ++k )
        {
            stack_info.stacks[ i ].push( deck.pop() );
        }
    }
}

function init_cards()
{
    // Initialize the stack's starting positions.
    for ( var i = 0; i < 7; ++i )
    {
        var x = -0.9 + ( card_dim.width + card_dim.offset ) * i;
        stack_info.stack_pos.push( vec2( x, 0.481 ) )
    }

    // Init the card positions in the deck's initial position.
    for ( var i = 0; i < 52; ++i )
    {
        cards.cards_x[ i ] = deck_pos[ 0 ];
        cards.cards_y[ i ] = deck_pos[ 1 ]
    }

    // Initialize each card's position in the stacks.
    for ( var i = 0; i < 7; ++i )
    {
        for ( var k = 0; k < i + 1; ++k )
        {
            cards.cards_x[ stack_info.stacks[ i ][ k ] ] = stack_info.stack_pos[ i ][ 0 ];
            cards.cards_y[ stack_info.stacks[ i ][ k ] ] = stack_info.stack_pos[ i ][ 1 ] - card_dim.offset * k;
        }
    }

    for ( var i = 0; i < 52; ++i )
    {
        cards.cards_col.push( colors[ i % 6 ] );
    }

    // Initialize the render index of all cards to -1 ( not rendered )
    for ( var i = 0; i < 52; ++i )
    {
        cards.render_index.push( -1 );
    }
}

function init_render()
{
    for ( var i = 0; i < 7; ++i )
    {
        for ( var k = 0; k < i + 1; ++k )
        {
            var index =  stack_info.stacks[ i ][ k ];
            cards.render_index[ index ] = render_info.render_vertices_x.length;
            render_info.render_vertices_x.push( cards.cards_x[ index ] );
            render_info.render_vertices_y.push( cards.cards_y[ index ] );
            render_info.render_colors.push( cards.cards_col[ index ] );
        }
    }

    render_info.render_vertices_x.push( cards.cards_x[ deck.length - 1 ] );
    render_info.render_vertices_y.push( cards.cards_y[ deck.length - 1 ] );
    render_info.render_colors.push( cards.cards_col[ deck.length - 1 ] );
}

// Initialize starting information on what can and can't be clicked, etc.
function init_info()
{
    // Initialize the array that tells which cards are "face-up"
    for ( var i = 0; i < 52; ++i )
    {
        card_info.face_up.push( 0 );
    }

    for ( var i = 0; i < 7; ++i )
    {
        card_info.face_up[ stack_info.stacks[ i ][ stack_info.stacks[ i ].length - 1 ] ] = 1;
    }

    // Initialize the array that tells where a certain card can be placed, but only populate it when
    // a card is selected.
    card_info.place_pos = []; 
}

window.onload = function()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl )
    {
        alert( "WebGL is not available." );
        return;
    }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.75, 0.0, 1.0 );

    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    verticesBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, verticesBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, 8 * 312, gl.STATIC_DRAW );

    vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    verticesColorBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, verticesColorBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, 16 * 312, gl.STATIC_DRAW );

    vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );
    
    canvas.addEventListener( "mousedown", mouseDown );
    canvas.addEventListener( "mouseup", mouseUp );
    canvas.addEventListener( "mousemove", mouseMove );

    init();

    setInterval( render, 15 );
};
