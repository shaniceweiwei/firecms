import {
    ArrayProperty,
    EntitySchema,
    EnumType,
    EnumValues,
    MapProperty,
    Properties,
    Property,
    ReferenceProperty,
    StringProperty
} from "../models";
import React, { createElement } from "react";
import { firestore } from "firebase/app";

import {
    Box,
    CardMedia,
    Checkbox,
    Chip,
    Divider,
    Grid,
    List,
    ListItem,
    Table,
    TableBody,
    TableCell,
    TableRow,
    Typography
} from "@material-ui/core";
import StorageThumbnail from "./StorageThumbnail";
import ReferencePreview from "./ReferencePreview";
import { PreviewComponentProps } from "./PreviewComponentProps";
import { useStyles } from "../styles";

export default function PreviewComponent<T>({
                                                value,
                                                property,
                                                small
                                            }: PreviewComponentProps<T>
) {

    if (!property) {
        console.error("No property assigned for preview component", value, property, small);
    }

    let content: JSX.Element | any;

    if (property.config?.customPreview) {
        content = createElement(property.config.customPreview as React.ComponentType<PreviewComponentProps<T>>,
            {
                value,
                property,
                small
            });
    } else if (property.dataType === "string" && typeof value === "string") {
        const stringProperty = property as StringProperty;
        if (stringProperty.config?.urlMediaType) {
            content = renderUrlComponent(stringProperty, value, small);
        } else if (stringProperty.config?.storageMeta) {
            content = renderStorageThumbnail(stringProperty, value as string, small);
        } else {
            content = renderString(stringProperty, value, small);
        }
    } else if (property.dataType === "array" && value instanceof Array) {
        const arrayProperty = property as ArrayProperty;

        if ("dataType" in arrayProperty.of) {
            if (arrayProperty.of.dataType === "map") {
                content = renderArrayOfMaps(arrayProperty.of.properties, value, small, arrayProperty.of.previewProperties);
            } else if (arrayProperty.of.dataType === "string") {
                if (arrayProperty.of.config?.enumValues) {
                    content = renderArrayEnumTableCell(
                        arrayProperty.of.config?.enumValues,
                        value
                    );
                } else if (arrayProperty.of.config?.storageMeta) {
                    content = renderGenericArray(arrayProperty.of, value);
                } else {
                    content = renderArrayOfStrings(value);
                }
            } else {
                content = renderGenericArray(arrayProperty.of, value);
            }
        } else {
            content = renderShapedArray(arrayProperty.of, value);
        }
    } else if (property.dataType === "map" && typeof value === "object") {
        content = renderMap(property as MapProperty, value, small);
    } else if (property.dataType === "timestamp" && value instanceof Date) {
        content = value && value.toLocaleString();
    } else if (property.dataType === "reference" && value instanceof firestore.DocumentReference) {
        const referenceProperty = property as ReferenceProperty;
        content = value && renderReference(value, referenceProperty.schema, small, referenceProperty.previewProperties);
    } else if (property.dataType === "boolean") {
        content = renderBoolean(!!value);
    } else {
        content = value;
    }
    return (content ? content : null);
};

function renderMap<T>(property: MapProperty<T>, value: T, small: boolean) {

    if (!value) return null;

    const classes = useStyles();

    let mapProperties = property.previewProperties;
    if (!mapProperties || !mapProperties.length) {
        mapProperties = Object.keys(property.properties);
        if (small)
            mapProperties = mapProperties.slice(0, 3);
    }

    if (small)
        return (
            <List>
                {mapProperties.map((key: string) => (
                    <ListItem key={property.title + key}>
                        <PreviewComponent value={value[key] as any}
                                          property={property.properties[key]}
                                          small={small}/>
                    </ListItem>
                ))}
            </List>
        );

    return (
        <Table size="small" >
            <TableBody>
                {mapProperties &&
                mapProperties.map((key, index) => {
                    return (
                        <TableRow key={`table_${property.title}_${index}`} className={classes.tableNoBottomBorder}>
                            <TableCell key={`table-cell-title-${key}`}
                                       component="th">
                                <Typography variant={"body2"} color={"textSecondary"}>
                                    {property.properties[key].title}
                                </Typography>
                            </TableCell>
                            <TableCell key={`table-cell-${key}`} component="th">
                                <PreviewComponent
                                    value={value[key] as any}
                                    property={property.properties[key]}
                                    small={true}/>
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );

}

function renderArrayOfMaps(properties: Properties, values: any[], small: boolean, previewProperties?: string[]) {

    if (!values) return null;

    const classes = useStyles();

    let mapProperties = previewProperties;
    if (!mapProperties || !mapProperties.length) {
        mapProperties = Object.keys(properties);
        if (small)
            mapProperties = mapProperties.slice(0, 3);
    }

    return (
        <Table size="small" >
            <TableBody>
                {values &&
                values.map((value, index) => {
                    return (
                        <TableRow key={`table_${value}_${index}`}
                                  className={classes.tableNoBottomBorder}>
                            {mapProperties && mapProperties.map(
                                (key, index) => (
                                    <TableCell
                                        key={`table-cell-${key}`}
                                        component="th"
                                    >
                                        <PreviewComponent
                                            value={value[key] as any}
                                            property={properties[key]}
                                            small={true}/>
                                    </TableCell>
                                )
                            )}
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}

function renderArrayOfStrings(values: string[]) {

    if (!values) return null;

    if (values && !Array.isArray(values)) {
        return <div>{`Unexpected value: ${values}`}</div>;
    }
    return (
        <Grid>
            {values &&
            values.map((value, index) => (
                <Chip
                    size="small"
                    key={"preview_chip_" + value}
                    label={
                        <Typography variant="caption" color="textPrimary">
                            {value}
                        </Typography>
                    }
                />
            ))}
        </Grid>
    );
}

function renderArrayEnumTableCell<T extends EnumType>(
    enumValues: EnumValues<T>,
    values: T[]
) {

    if (!values) return null;

    return (
        <Grid>
            {values &&
            values.map((value, index) =>
                renderPreviewEnumChip(enumValues, value)
            )}
        </Grid>
    );
}

function renderGenericArray<T extends EnumType>(
    property: Property,
    values: T[]
) {

    if (!values) return null;

    return (
        <Grid>

            {values &&
            values.map((value, index) =>
                <React.Fragment key={"preview_array_" + value + "_" + index}>
                    <Box m={1}>
                        <PreviewComponent value={value}
                                          property={property}
                                          small={true}/>
                    </Box>
                    {index < values.length - 1 && <Divider/>}
                </React.Fragment>
            )}
        </Grid>
    );
}

function renderShapedArray<T extends EnumType>(
    properties: Property[],
    values: T[]
) {

    if (!values) return null;

    return (
        <Grid>
            {values &&
            properties.map((property, index) =>
                <React.Fragment
                    key={"preview_array_" + values[index] + "_" + index}>
                    {values[index] && <Box m={1}>
                        <PreviewComponent value={values[index]}
                                          property={property}
                                          small={true}/>
                    </Box>}
                    {values[index] && index < values.length - 1 && <Divider/>}
                </React.Fragment>
            )}
        </Grid>
    );
}

function renderUrlAudioComponent(value: string) {

    return (
        <audio controls src={value}>
            Your browser does not support the
            <code>audio</code> element.
        </audio>
    );
}

function renderUrlImageThumbnail(url: string,
                                 small: boolean) {
    return (
        <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            width={small ? 100 : 200}
            height={small ? 100 : 200}>
            <img src={url}
                 style={{
                     maxWidth: small ? 100 : 200,
                     maxHeight: small ? 100 : 200
                 }}/>
        </Box>
    );
}

function renderUrlVideo(url: string,
                        small: boolean) {
    return (
        <CardMedia
            style={{ maxWidth: small ? 300 : 500 }}
            component="video"
            controls
            image={url}
        />
    );
}

function renderReference<S extends EntitySchema>(
    ref: firestore.DocumentReference,
    refSchema: S,
    small: boolean,
    previewProperties?: (keyof S["properties"])[]
) {

    if (!ref) return null;

    return (
        <ReferencePreview
            reference={ref}
            schema={refSchema}
            previewComponent={PreviewComponent}
            previewProperties={previewProperties}
            small={small}
        />
    );
}

export function renderUrlComponent(property: StringProperty,
                                   url: any,
                                   small: boolean = false) {

    if (!url) return <div/>;

    const mediaType = property.config?.urlMediaType || property.config?.storageMeta?.mediaType;
    if (mediaType === "image") {
        return renderUrlImageThumbnail(url, small);
    } else if (mediaType === "audio") {
        return renderUrlAudioComponent(url);
    } else if (mediaType === "video") {
        return renderUrlVideo(url, small);
    }
    throw Error("URL component misconfiguration");
}

export function renderString(property: StringProperty,
                             value: any,
                             small: boolean = false) {

    if (property.config?.enumValues) {
        return property.config?.enumValues[value];
    } else if (property.config?.multiline) {
        return <Box minWidth={300}
                    style={{ lineClamp: 5, textOverflow: "ellipsis" }}>
            {value}
        </Box>;
    } else {
        return <Box minWidth={120}>
            {value}
        </Box>;
    }

}

export function renderStorageThumbnail(
    property: StringProperty,
    storagePath: string | undefined,
    small: boolean
) {
    if (!storagePath) return null;

    return (
        <StorageThumbnail
            storagePath={storagePath}
            property={property}
            small={small}
            renderUrlComponent={renderUrlComponent}
        />
    );
}

export function renderBoolean(
    value: boolean | undefined
) {
    return <Checkbox disabled={true} checked={value}/>;
}

export function renderPreviewEnumChip<T extends EnumType>(
    enumValues: EnumValues<T>,
    value: any
) {
    if (!value) return null;
    const label = enumValues[value as T];
    return (
        <Chip
            size="small"
            key={"preview_chip_" + value}
            label={
                <Typography
                    variant="caption"
                    color={label ? "textPrimary" : "error"}
                >
                    {label || value}
                </Typography>
            }
        />
    );
}

