import * as XLSX from 'xlsx';

function convertToXlsx( mapping, data ) {
  const headers = mapping.map( item => item.header );
  const sheetData = data.map( item => {
    const row = {};
    mapping.forEach( mappingItem => {
      let value = item;
      for ( const key of mappingItem.accessor ) {
        if ( value && value[ key ] !== undefined ) {
          value = value[ key ];
        } else {
          value = null;
          break;
        }
      }
      if ( mappingItem.isSpan && value && Array.isArray( value ) ) {
        // 如果是跨列且值为数组，连接成字符串
        row[ mappingItem.header ] = value.join( ', ' );
      } else if ( mappingItem.isSpan && value ) {
        row[ mappingItem.header ] = value;
      } else {
        row[ mappingItem.header ] = value;
      }
    } );
    return row;
  } );
  const worksheet = XLSX.utils.json_to_sheet( sheetData, { header: headers } );
  // 处理跨列
  if ( worksheet && worksheet[ '!rows' ] ) {
    worksheet[ '!merges' ] = [];
    for ( let i = 0; i < worksheet[ '!rows' ].length; i++ ) {
      const row = worksheet[ '!rows' ][ i ];
      for ( let j = 0; j < row[ '!cells' ].length; j++ ) {
        const cell = row[ '!cells' ][ j ];
        if ( cell && cell.v && cell.v.isSpan ) {
          const { span, value } = cell.v;
          worksheet[ '!merges' ].push( { s: { r: i, c: j }, e: { r: i, c: j + span - 1 } } );
          cell.v = value;
        } else if ( cell && !cell.v ) {
          // 如果单元格值为空，设置一个默认值或者其他处理逻辑
          cell.v = '';
        }
      }
    }
  }
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet( workbook, worksheet, 'Sheet1' );
  return workbook;
}

const mapping = [
  { header: 'ID', accessor: [ 'id' ] },
  { header: 'Name', accessor: [ 'name' ] },
  { header: 'Age', accessor: [ 'details', 'age' ] },
  { header: 'City', accessor: [ 'details', 'city' ] },
  { header: 'Hobbies', accessor: [ 'details', 'hobbies' ], isSpan: true, span: 2 }, // 表示跨两列
];

const data = [
  {
    id: 1,
    name: 'John',
    details: {
      age: 30,
      city: 'New York',
      hobbies: [ 'Reading', 'Drawing' ]
    }
  }
];

const workbook = convertToXlsx( mapping, data );
XLSX.writeFile( workbook, `output${ new Date().getTime() }.xlsx` );